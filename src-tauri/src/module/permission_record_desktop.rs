pub fn has_desktop_record_permission() -> bool {
    let trusted = macos_accessibility_client::accessibility::application_is_trusted_with_prompt();
    return trusted;
}
