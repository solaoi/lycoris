use std::str::FromStr;

pub enum ModelTypeNllb {
    Nllb1_3b,
    Nllb600mDistilled,
}

impl ModelTypeNllb {
    pub fn as_str(&self) -> &'static str {
        match self {
            ModelTypeNllb::Nllb1_3b => "1_3b",
            ModelTypeNllb::Nllb600mDistilled => "distilled-600m",
        }
    }
}

impl FromStr for ModelTypeNllb {
    type Err = ();

    fn from_str(input: &str) -> Result<ModelTypeNllb, Self::Err> {
        match input {
            "1_3b" => Ok(ModelTypeNllb::Nllb1_3b),
            "distilled-600m" => Ok(ModelTypeNllb::Nllb600mDistilled),
            _ => Err(()),
        }
    }
}
