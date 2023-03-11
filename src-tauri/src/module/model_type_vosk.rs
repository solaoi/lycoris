use std::str::FromStr;

pub enum ModelTypeVosk {
    SmallJapanese,
    Japanese,
    SmallEnglish,
    English,
}

impl ModelTypeVosk {
    pub fn as_str(&self) -> &'static str {
        match self {
            ModelTypeVosk::SmallJapanese => "small-ja-0.22",
            ModelTypeVosk::Japanese => "ja-0.22",
            ModelTypeVosk::SmallEnglish => "small-en-us-0.15",
            ModelTypeVosk::English => "en-us-0.22",
        }
    }
}

impl FromStr for ModelTypeVosk {
    type Err = ();

    fn from_str(input: &str) -> Result<ModelTypeVosk, Self::Err> {
        match input {
            "small-ja-0.22" => Ok(ModelTypeVosk::SmallJapanese),
            "ja-0.22" => Ok(ModelTypeVosk::Japanese),
            "small-en-us-0.15" => Ok(ModelTypeVosk::SmallEnglish),
            "en-us-0.22" => Ok(ModelTypeVosk::English),
            _ => Err(()),
        }
    }
}
