use std::str::FromStr;

pub enum ModelTypeVosk {
    Japanese,
    English,
}

impl ModelTypeVosk {
    pub fn as_str(&self) -> &'static str {
        match self {
            ModelTypeVosk::Japanese => "ja",
            ModelTypeVosk::English => "en-us",
        }
    }
}

impl FromStr for ModelTypeVosk {
    type Err = ();

    fn from_str(input: &str) -> Result<ModelTypeVosk, Self::Err> {
        match input {
            "ja" => Ok(ModelTypeVosk::Japanese),
            "en-us" => Ok(ModelTypeVosk::English),
            _ => Err(()),
        }
    }
}
