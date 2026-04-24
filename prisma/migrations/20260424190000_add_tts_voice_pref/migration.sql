-- Oturum 18: User TTS voice preference. Default female.
ALTER TABLE "users" ADD COLUMN "ttsVoicePreference" VARCHAR(10) NOT NULL DEFAULT 'female';
