use std::str::FromStr;

pub enum ModelTypeWhisper {
    Base,
    BaseEn,
    Large,
    LargeDistilEn,
    LargeDistilJa,
    Medium,
    MediumEn,
    Small,
    SmallEn,
    Tiny,
    TinyEn,
}

impl ModelTypeWhisper {
    pub fn as_str(&self) -> &'static str {
        match self {
            ModelTypeWhisper::Base => "base",
            ModelTypeWhisper::BaseEn => "base.en",
            ModelTypeWhisper::Large => "large",
            ModelTypeWhisper::LargeDistilEn => "large-distil.en",
            ModelTypeWhisper::LargeDistilJa => "large-distil.ja",
            ModelTypeWhisper::Medium => "medium",
            ModelTypeWhisper::MediumEn => "medium.en",
            ModelTypeWhisper::Small => "small",
            ModelTypeWhisper::SmallEn => "small.en",
            ModelTypeWhisper::Tiny => "tiny",
            ModelTypeWhisper::TinyEn => "tiny.en",
        }
    }
}

impl FromStr for ModelTypeWhisper {
    type Err = ();

    fn from_str(input: &str) -> Result<ModelTypeWhisper, Self::Err> {
        match input {
            "base" => Ok(ModelTypeWhisper::Base),
            "base.en" => Ok(ModelTypeWhisper::BaseEn),
            "large" => Ok(ModelTypeWhisper::Large),
            "large-distil.en" => Ok(ModelTypeWhisper::LargeDistilEn),
            "large-distil.ja" => Ok(ModelTypeWhisper::LargeDistilJa),
            "medium" => Ok(ModelTypeWhisper::Medium),
            "medium.en" => Ok(ModelTypeWhisper::MediumEn),
            "small" => Ok(ModelTypeWhisper::Small),
            "small.en" => Ok(ModelTypeWhisper::SmallEn),
            "tiny" => Ok(ModelTypeWhisper::Tiny),
            "tiny.en" => Ok(ModelTypeWhisper::TinyEn),
            _ => Err(()),
        }
    }
}
