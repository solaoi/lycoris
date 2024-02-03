pub struct Speaker {}

impl Speaker {
    pub fn play_ja(text: &str) {
        let _ = std::process::Command::new("sh")
            .arg("-c")
            .arg(format!("say -v Kyoko {}", text))
            .status()
            .expect("failed");
    }

    pub fn play_en(text: &str) {
        let _ = std::process::Command::new("sh")
            .arg("-c")
            .arg(format!("say -v Samantha {}", text))
            .status()
            .expect("failed");
    }

    pub fn play_cn(text: &str) {
        let _ = std::process::Command::new("sh")
            .arg("-c")
            .arg(format!("say -v Tingting {}", text))
            .status()
            .expect("failed");
    }
}
