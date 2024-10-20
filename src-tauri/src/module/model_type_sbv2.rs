use std::str::FromStr;

pub enum ModelTypeStyleBertVits2 {
    TsukuyomiChan,
    KoharuneAmi,
    Amitaro,
    JvnvF1Jp,
    JvnvF2Jp,
    JvnvM1Jp,
    JvnvM2Jp,
}

impl ModelTypeStyleBertVits2 {
    pub fn as_str(&self) -> &'static str {
        match self {
            ModelTypeStyleBertVits2::TsukuyomiChan => "tsukuyomi-chan",
            ModelTypeStyleBertVits2::KoharuneAmi => "koharune-ami",
            ModelTypeStyleBertVits2::Amitaro => "amitaro",
            ModelTypeStyleBertVits2::JvnvF1Jp => "jvnv-F1-jp",
            ModelTypeStyleBertVits2::JvnvF2Jp => "jvnv-F2-jp",
            ModelTypeStyleBertVits2::JvnvM1Jp => "jvnv-M1-jp",
            ModelTypeStyleBertVits2::JvnvM2Jp => "jvnv-M2-jp",
        }
    }
}

impl FromStr for ModelTypeStyleBertVits2 {
    type Err = ();

    fn from_str(input: &str) -> Result<ModelTypeStyleBertVits2, Self::Err> {
        match input {
            "tsukuyomi-chan" => Ok(ModelTypeStyleBertVits2::TsukuyomiChan),
            "koharune-ami" => Ok(ModelTypeStyleBertVits2::KoharuneAmi),
            "amitaro" => Ok(ModelTypeStyleBertVits2::Amitaro),
            "jvnv-F1-jp" => Ok(ModelTypeStyleBertVits2::JvnvF1Jp),
            "jvnv-F2-jp" => Ok(ModelTypeStyleBertVits2::JvnvF2Jp),
            "jvnv-M1-jp" => Ok(ModelTypeStyleBertVits2::JvnvM1Jp),
            "jvnv-M2-jp" => Ok(ModelTypeStyleBertVits2::JvnvM2Jp),
            _ => Err(()),
        }
    }
}
