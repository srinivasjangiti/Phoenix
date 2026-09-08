use serde::Serialize;
use std::collections::VecDeque;
use std::io::{BufRead, BufReader};
use std::path::PathBuf;
use std::process::{Child, Command, Stdio};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::{Duration, Instant};
use tauri::{AppHandle, Emitter, Manager};
use crate::log_to_file;

const DEFAULT_PORT: u16 = 7777;
const MAX_LOG_LINES: usize = 200;
const HEALTH_POLL_INTERVAL_MS: u64 = 400;
const MAX_HEALTH_CHECK_SECS: u64 = 45;

#[derive(Debug, Clone, Copy, Serialize, PartialEq, Eq)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum BackendState {
    Starting,
    StartingBackend,
    Checking,
    Ready,
    BackendStartFailed,
    BackendCrashed,
    BackendUnresponsive,
    DatabaseUnavailable,
}

#[derive(Debug, Clone, Serialize)]
pub struct BackendStatus {
    pub state: BackendState,
    pub port: u16,
    pub message: String,
    pub recent_logs: Vec<String>,
    pub pid: Option<u32>,
}

#[cfg(target_os = "windows")]
mod job_object {
    use std::os::windows::io::AsRawHandle;
    use std::process::Child;

    #[repr(C)]
    #[allow(non_snake_case)]
    struct IO_COUNTERS {
        ReadOperationCount: u64,
        WriteOperationCount: u64,
        OtherOperationCount: u64,
        ReadTransferCount: u64,
        WriteTransferCount: u64,
        OtherTransferCount: u64,
    }

    #[repr(C)]
    #[allow(non_snake_case)]
    struct JOBOBJECT_BASIC_LIMIT_INFORMATION {
        PerProcessUserTimeLimit: i64,
        PerJobUserTimeLimit: i64,
        LimitFlags: u32,
        MinimumWorkingSetSize: usize,
        MaximumWorkingSetSize: usize,
        ActiveProcessLimit: u32,
        Affinity: usize,
        PriorityClass: u32,
        SchedulingClass: u32,
    }

    #[repr(C)]
    #[allow(non_snake_case)]
    struct JOBOBJECT_EXTENDED_LIMIT_INFORMATION {
        BasicLimitInformation: JOBOBJECT_BASIC_LIMIT_INFORMATION,
        IoInfo: IO_COUNTERS,
        ProcessMemoryLimit: usize,
        JobMemoryLimit: usize,
        PeakProcessMemoryUsed: usize,
        PeakJobMemoryUsed: usize,
    }

    const JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE: u32 = 0x2000;
    const JobObjectExtendedLimitInformation: u32 = 9;

    extern "system" {
        fn CreateJobObjectW(lpJobAttributes: *mut std::ffi::c_void, lpName: *const u16) -> *mut std::ffi::c_void;
        fn SetInformationJobObject(
            hJob: *mut std::ffi::c_void,
            JobObjectInformationClass: u32,
            lpJobObjectInformation: *const std::ffi::c_void,
            cbJobObjectInformationLength: u32,
        ) -> i32;
        fn AssignProcessToJobObject(hJob: *mut std::ffi::c_void, hProcess: *mut std::ffi::c_void) -> i32;
        fn CloseHandle(hObject: *mut std::ffi::c_void) -> i32;
    }

    pub struct ProcessJob {
        handle: *mut std::ffi::c_void,
    }

    unsafe impl Send for ProcessJob {}
    unsafe impl Sync for ProcessJob {}

    impl ProcessJob {
        pub fn new() -> Option<Self> {
            unsafe {
                let handle = CreateJobObjectW(std::ptr::null_mut(), std::ptr::null());
                if handle.is_null() {
                    return None;
                }

                let mut info: JOBOBJECT_EXTENDED_LIMIT_INFORMATION = std::mem::zeroed();
                info.BasicLimitInformation.LimitFlags = JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE;

                let ok = SetInformationJobObject(
                    handle,
                    JobObjectExtendedLimitInformation,
                    &info as *const _ as *const std::ffi::c_void,
                    std::mem::size_of::<JOBOBJECT_EXTENDED_LIMIT_INFORMATION>() as u32,
                );

                if ok == 0 {
                    CloseHandle(handle);
                    return None;
                }

                Some(Self { handle })
            }
        }

        pub fn assign(&self, child: &Child) -> bool {
            if self.handle.is_null() {
                return false;
            }
            unsafe {
                let proc_handle = child.as_raw_handle() as *mut std::ffi::c_void;
                AssignProcessToJobObject(self.handle, proc_handle) != 0
            }
        }
    }

    impl Drop for ProcessJob {
        fn drop(&mut self) {
            if !self.handle.is_null() {
                unsafe {
                    CloseHandle(self.handle);
                }
            }
        }
    }
}

#[cfg(not(target_os = "windows"))]
mod job_object {
    use std::process::Child;
    pub struct ProcessJob;
    impl ProcessJob {
        pub fn new() -> Option<Self> { Some(Self) }
        pub fn assign(&self, _child: &Child) -> bool { true }
    }
}

pub struct BackendSupervisor {
    state: Arc<Mutex<BackendState>>,
    message: Arc<Mutex<String>>,
    port: u16,
    child: Mutex<Option<Child>>,
    job: Option<job_object::ProcessJob>,
    logs: Arc<Mutex<VecDeque<String>>>,
    is_shutting_down: Arc<Mutex<bool>>,
    service_dir: PathBuf,
    node_bin: PathBuf,
    phoenix_script: PathBuf,
}

impl BackendSupervisor {
    pub fn new() -> Result<Self, String> {
        let (service_dir, node_bin, phoenix_script) = resolve_runtime_paths()?;
        let job = job_object::ProcessJob::new();

        Ok(Self {
            state: Arc::new(Mutex::new(BackendState::Starting)),
            message: Arc::new(Mutex::new("Initializing Phoenix desktop supervisor...".to_string())),
            port: DEFAULT_PORT,
            child: Mutex::new(None),
            job,
            logs: Arc::new(Mutex::new(VecDeque::with_capacity(MAX_LOG_LINES))),
            is_shutting_down: Arc::new(Mutex::new(false)),
            service_dir,
            node_bin,
            phoenix_script,
        })
    }

    pub fn get_service_dir(&self) -> PathBuf {
        self.service_dir.clone()
    }

    pub fn get_status(&self) -> BackendStatus {
        let state = *self.state.lock().unwrap();
        let message = self.message.lock().unwrap().clone();
        let recent_logs = self
            .logs
            .lock()
            .unwrap()
            .iter()
            .cloned()
            .collect::<Vec<_>>();
        let pid = self
            .child
            .lock()
            .unwrap()
            .as_ref()
            .map(|c| c.id());

        BackendStatus {
            state,
            port: self.port,
            message,
            recent_logs,
            pid,
        }
    }

    fn set_state(&self, app: &AppHandle, new_state: BackendState, msg: &str) {
        {
            let mut s = self.state.lock().unwrap();
            *s = new_state;
            let mut m = self.message.lock().unwrap();
            *m = msg.to_string();
        }

        self.append_log(format!("[Supervisor] {:?} — {}", new_state, msg));
        log_to_file(&format!("[Supervisor] {:?} — {}", new_state, msg));
        let status = self.get_status();
        let _ = app.emit("backend-state-changed", &status);
    }

    fn append_log(&self, line: String) {
        let mut logs = self.logs.lock().unwrap();
        if logs.len() >= MAX_LOG_LINES {
            logs.pop_front();
        }
        logs.push_back(line);
    }

    pub fn start(&self, app: AppHandle) {
        // Step 1: Check if a healthy Phoenix instance is already running on port 7777
        self.set_state(&app, BackendState::Starting, "Checking for existing Phoenix instance...");
        if is_port_healthy(self.port) {
            self.set_state(
                &app,
                BackendState::Ready,
                "Connected to existing Phoenix service.",
            );
            if let Some(main_win) = app.get_webview_window("main") {
                let target_url = format!("http://127.0.0.1:{}/v2/", self.port);
                log_to_file(&format!("[Supervisor] Existing healthy service — navigating to {}", target_url));
                let _ = main_win.eval(&format!("window.location.replace('{}');", target_url));
            }
            return;
        }

        // Step 2: Spawn Node backend
        self.set_state(
            &app,
            BackendState::StartingBackend,
            "Starting Phoenix backend engine...",
        );

        log_to_file(&format!(
            "[Supervisor] Spawning backend child: {:?} with script {:?}",
            self.node_bin, self.phoenix_script
        ));

        let mut cmd = Command::new(&self.node_bin);
        cmd.arg(&self.phoenix_script)
            .arg("start")
            .arg("--supervised")
            .current_dir(&self.service_dir)
            .env("PHOENIX_SUPERVISED", "1")
            .env("PHOENIX_PORT", self.port.to_string())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());

        #[cfg(target_os = "windows")]
        {
            // CREATE_NO_WINDOW flag to prevent console popups
            use std::os::windows::process::CommandExt;
            cmd.creation_flags(0x08000000);
        }

        let mut child = match cmd.spawn() {
            Ok(c) => c,
            Err(e) => {
                let err_msg = format!("Failed to spawn Phoenix backend: {}", e);
                log_to_file(&format!("[Supervisor] ERROR: {}", err_msg));
                self.set_state(&app, BackendState::BackendStartFailed, &err_msg);
                return;
            }
        };

        let pid = child.id();
        if let Some(job) = &self.job {
            let assigned = job.assign(&child);
            self.append_log(format!("[Supervisor] Attached backend PID {} to Job Object (kill-on-close: {})", pid, assigned));
            log_to_file(&format!("[Supervisor] Attached backend PID {} to Job Object (kill-on-close: {})", pid, assigned));
        }
        self.append_log(format!("[Supervisor] Spawned backend child (PID: {})", pid));
        log_to_file(&format!("[Supervisor] Spawned backend child (PID: {})", pid));

        // Pipe stdout & stderr to rolling logs
        if let Some(stdout) = child.stdout.take() {
            let logs_clone = Arc::clone(&self.logs);
            thread::spawn(move || {
                let reader = BufReader::new(stdout);
                for line in reader.lines().map_while(Result::ok) {
                    println!("[Phoenix Node] {}", line);
                    let mut l = logs_clone.lock().unwrap();
                    if l.len() >= MAX_LOG_LINES {
                        l.pop_front();
                    }
                    l.push_back(line);
                }
            });
        }

        if let Some(stderr) = child.stderr.take() {
            let logs_clone = Arc::clone(&self.logs);
            thread::spawn(move || {
                let reader = BufReader::new(stderr);
                for line in reader.lines().map_while(Result::ok) {
                    eprintln!("[Phoenix Node ERR] {}", line);
                    let mut l = logs_clone.lock().unwrap();
                    if l.len() >= MAX_LOG_LINES {
                        l.pop_front();
                    }
                    l.push_back(format!("[ERR] {}", line));
                }
            });
        }

        {
            let mut lock = self.child.lock().unwrap();
            *lock = Some(child);
        }

        // Step 3: Transition to CHECKING and poll health
        self.set_state(
            &app,
            BackendState::Checking,
            "Waiting for Phoenix service to become ready...",
        );

        let app_clone = app.clone();
        let port = self.port;
        let is_shutting_down = Arc::clone(&self.is_shutting_down);
        let logs_ref = Arc::clone(&self.logs);
        let state_ref = Arc::clone(&self.state);
        let msg_ref = Arc::clone(&self.message);

        thread::spawn(move || {
            let start_time = Instant::now();
            let deadline = Duration::from_secs(MAX_HEALTH_CHECK_SECS);

            loop {
                if *is_shutting_down.lock().unwrap() {
                    break;
                }

                if is_port_healthy(port) {
                    // Transition to READY
                    {
                        let mut s = state_ref.lock().unwrap();
                        *s = BackendState::Ready;
                        let mut m = msg_ref.lock().unwrap();
                        *m = "Phoenix is ready.".to_string();
                    }

                    {
                        let mut l = logs_ref.lock().unwrap();
                        if l.len() >= MAX_LOG_LINES {
                            l.pop_front();
                        }
                        l.push_back("[Supervisor] Health check passed — Phoenix is READY".into());
                    }

                    log_to_file("[Supervisor] Health check passed — Phoenix is READY");

                    let status = BackendStatus {
                        state: BackendState::Ready,
                        port,
                        message: "Phoenix is ready.".into(),
                        recent_logs: logs_ref.lock().unwrap().iter().cloned().collect(),
                        pid: Some(pid),
                    };
                    let _ = app_clone.emit("backend-state-changed", &status);

                    // Directly navigate the main webview window to the Phoenix frontend
                    if let Some(main_win) = app_clone.get_webview_window("main") {
                        let target_url = format!("http://127.0.0.1:{}/v2/", port);
                        log_to_file(&format!("[Supervisor] Auto-navigating main window to: {}", target_url));
                        let _ = main_win.eval(&format!("window.location.replace('{}');", target_url));
                    } else {
                        log_to_file("[Supervisor] WARNING: Could not find 'main' webview window for auto-navigation");
                    }
                    break;
                }

                if start_time.elapsed() > deadline {
                    {
                        let mut s = state_ref.lock().unwrap();
                        *s = BackendState::BackendUnresponsive;
                        let mut m = msg_ref.lock().unwrap();
                        *m = "Phoenix took longer than expected to initialize.".to_string();
                    }

                    let status = BackendStatus {
                        state: BackendState::BackendUnresponsive,
                        port,
                        message: "Phoenix took longer than expected to initialize.".into(),
                        recent_logs: logs_ref.lock().unwrap().iter().cloned().collect(),
                        pid: Some(pid),
                    };
                    let _ = app_clone.emit("backend-state-changed", &status);
                    log_to_file("[Supervisor] Health check timed out after 45s");
                    break;
                }

                thread::sleep(Duration::from_millis(HEALTH_POLL_INTERVAL_MS));
            }
        });
    }

    pub fn shutdown(&self) {
        let mut shutdown_guard = self.is_shutting_down.lock().unwrap();
        if *shutdown_guard {
            return;
        }
        *shutdown_guard = true;

        println!("[Supervisor] Initiating graceful shutdown of Phoenix...");

        // 1. Try graceful HTTP shutdown request
        let shutdown_url = format!("http://127.0.0.1:{}/api/v1/shutdown", self.port);
        let _ = ureq::post(&shutdown_url)
            .timeout(Duration::from_millis(1500))
            .call();

        // 2. Wait up to 3 seconds for the child process to exit cleanly
        let mut child_guard = self.child.lock().unwrap();
        if let Some(mut child) = child_guard.take() {
            let start = Instant::now();
            let mut exited = false;

            while start.elapsed() < Duration::from_secs(3) {
                match child.try_wait() {
                    Ok(Some(status)) => {
                        println!("[Supervisor] Backend exited cleanly with status: {:?}", status);
                        exited = true;
                        break;
                    }
                    Ok(None) => thread::sleep(Duration::from_millis(100)),
                    Err(_) => break,
                }
            }

            // 3. Force-kill if still alive
            if !exited {
                println!("[Supervisor] Backend did not stop in time; force-killing process tree...");
                #[cfg(target_os = "windows")]
                {
                    use std::os::windows::process::CommandExt;
                    let pid = child.id();
                    let _ = Command::new("taskkill")
                        .args(["/PID", &pid.to_string(), "/T", "/F"])
                        .creation_flags(0x08000000)
                        .output();
                }
                let _ = child.kill();
            }
        }

        println!("[Supervisor] Shutdown complete.");
    }
}

fn is_port_healthy(port: u16) -> bool {
    let url = format!("http://127.0.0.1:{}/health", port);
    if let Ok(resp) = ureq::get(&url)
        .timeout(Duration::from_millis(800))
        .call()
    {
        if resp.status() == 200 {
            if let Ok(json) = resp.into_json::<serde_json::Value>() {
                let ok = json.get("ok").and_then(|v| v.as_bool()).unwrap_or(false);
                let is_super = json.get("superCarrier").and_then(|v| v.as_bool()).unwrap_or(false);
                let craft_healthy = json.get("craftHealthy").and_then(|v| v.as_bool()).unwrap_or(false);
                let carrier_ready = json.get("carrier").and_then(|v| v.as_bool()).unwrap_or(false);

                if ok {
                    if is_super {
                        return craft_healthy || carrier_ready;
                    }
                    return true;
                }
            }
        }
    }
    false
}

fn resolve_runtime_paths() -> Result<(PathBuf, PathBuf, PathBuf), String> {
    // Determine executable directory
    let exe_dir = std::env::current_exe()
        .map_err(|e| format!("Failed to determine exe path: {}", e))?
        .parent()
        .ok_or_else(|| "Failed to get exe parent directory".to_string())?
        .to_path_buf();

    // 1. Walk up ancestors to find phoenix.js
    let mut found_service_dir = None;
    let mut found_phoenix_script = None;

    let mut curr = Some(exe_dir.as_path());
    while let Some(dir) = curr {
        // Direct in dir
        let direct = dir.join("phoenix.js");
        if direct.exists() {
            found_service_dir = Some(dir.to_path_buf());
            found_phoenix_script = Some(direct);
            break;
        }
        // Inside service/ subdirectory
        let sub = dir.join("service").join("phoenix.js");
        if sub.exists() {
            found_service_dir = Some(dir.join("service"));
            found_phoenix_script = Some(sub);
            break;
        }
        curr = dir.parent();
    }

    // Also check current working directory as fallback
    if found_service_dir.is_none() {
        if let Ok(cwd) = std::env::current_dir() {
            let cwd_script = cwd.join("phoenix.js");
            if cwd_script.exists() {
                found_service_dir = Some(cwd.clone());
                found_phoenix_script = Some(cwd_script);
            } else {
                let cwd_sub = cwd.join("service").join("phoenix.js");
                if cwd_sub.exists() {
                    found_service_dir = Some(cwd.join("service"));
                    found_phoenix_script = Some(cwd_sub);
                }
            }
        }
    }

    let service_dir = found_service_dir.ok_or_else(|| {
        format!(
            "Could not locate Phoenix service directory (searched ancestors of {:?})",
            exe_dir
        )
    })?;
    let phoenix_script = found_phoenix_script.unwrap();

    // 2. Locate node runtime
    // Check ancestors for portable node: node/node.exe or node.exe
    let mut found_node = None;
    let mut curr_node = Some(exe_dir.as_path());
    while let Some(dir) = curr_node {
        let candidate = dir.join("node").join("node.exe");
        if candidate.exists() {
            found_node = Some(candidate);
            break;
        }
        let direct = dir.join("node.exe");
        if direct.exists() {
            found_node = Some(direct);
            break;
        }
        curr_node = dir.parent();
    }

    let node_bin = found_node.unwrap_or_else(|| {
        let prog_node = PathBuf::from(r"C:\Program Files\nodejs\node.exe");
        if prog_node.exists() {
            prog_node
        } else {
            PathBuf::from("node")
        }
    });

    println!(
        "[Supervisor] Resolved runtime paths:\n  Service dir: {:?}\n  Node binary: {:?}\n  Script: {:?}",
        service_dir, node_bin, phoenix_script
    );
    log_to_file(&format!(
        "[Supervisor] Resolved runtime paths:\n  Service dir: {:?}\n  Node binary: {:?}\n  Script: {:?}",
        service_dir, node_bin, phoenix_script
    ));

    Ok((service_dir, node_bin, phoenix_script))
}
