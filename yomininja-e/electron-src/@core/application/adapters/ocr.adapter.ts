import { OcrResult } from "../../domain/ocr_result/ocr_result";
import { OcrEngineSettings } from "../../domain/settings_preset/settings_preset";

export type OcrRecognitionInput = {    
    imageBuffer: Buffer;
    languageCode: string; // Two letters
};

export interface OcrEngineSettingsOptions {
    inference_runtime: {
        value: string,
        displayName: string;
    }[]
}

export type UpdateOcrAdapterSettingsOutput< TSettings extends OcrEngineSettings = OcrEngineSettings > = {
    settings: TSettings;
    restart: boolean;
};

export interface OcrAdapter< TSettings extends OcrEngineSettings = OcrEngineSettings > {     
    name: string;
    status: OcrAdapterStatus;
    initialize: ( serviceAddress?: string ) => void;
    recognize: ( input: OcrRecognitionInput ) => Promise< OcrResult | null >;
    getSupportedLanguages: () => Promise< string[] >; // Get this by calling the grpc stub or reading it's config files
    updateSettings: ( settingsUpdate: TSettings, oldSettings?: TSettings ) => Promise< UpdateOcrAdapterSettingsOutput< TSettings > >;
    getDefaultSettings: () => TSettings;
    getSettingsOptions: () => OcrEngineSettingsOptions;
    restart: ( callback: () => void ) => void;
}

export enum OcrAdapterStatus {
    Enabled = "Enabled",
    Disabled = "Disabled",
    Restarting = "Restarting",
    Processing = "Processing",
}