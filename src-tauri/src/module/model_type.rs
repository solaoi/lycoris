use std::str::FromStr;

pub enum ModelType {
    Base,
    BaseEn,
    LargeV1,
    Large,
    Medium,
    MediumEn,
    Small,
    SmallEn,
    Tiny,
    TinyEn,
}

impl ModelType {
    pub fn as_str(&self) -> &'static str {
        match self {
            ModelType::Base => "base",
            ModelType::BaseEn => "base.en",
            ModelType::LargeV1 => "large-v1",
            ModelType::Large => "large",
            ModelType::Medium => "medium",
            ModelType::MediumEn => "medium.en",
            ModelType::Small => "small",
            ModelType::SmallEn => "small.en",
            ModelType::Tiny => "tiny",
            ModelType::TinyEn => "tiny.en",
        }
    }
}

impl FromStr for ModelType {
    type Err = ();

    fn from_str(input: &str) -> Result<ModelType, Self::Err> {
        match input {
            "base" => Ok(ModelType::Base),
            "base.en" => Ok(ModelType::BaseEn),
            "large-v1" => Ok(ModelType::LargeV1),
            "large" => Ok(ModelType::Large),
            "medium" => Ok(ModelType::Medium),
            "medium.en" => Ok(ModelType::MediumEn),
            "small" => Ok(ModelType::Small),
            "small.en" => Ok(ModelType::SmallEn),
            "tiny" => Ok(ModelType::Tiny),
            "tiny.en" => Ok(ModelType::TinyEn),
            _ => Err(()),
        }
    }
}
