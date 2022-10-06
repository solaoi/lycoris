use std::{env, path::PathBuf};

fn env_var(var: &str) -> String {
    env::var(var).unwrap_or_else(|_| panic!("`{}` is not set", var))
}

fn main() {
    let lib_path = PathBuf::from(env_var("CARGO_MANIFEST_DIR")).join("lib");
    println!(
        "cargo:rustc-link-search=native={}",
        lib_path.to_str().unwrap()
    );
    let is_release = match &*env_var("PROFILE") {
        "debug" => false,
        "release" => true,
        _ => panic!("unexpected value set for PROFILE env"),
    };
    if is_release {
        println!("cargo:rustc-link-arg=-Wl,-rpath,@executable_path/../Resources/lib");
    } else {
        println!("cargo:rustc-link-arg=-Wl,-rpath,@executable_path/../../lib");
    }
    tauri_build::build()
}
