require 'google_drive'

class Hoge
  KEY = ENV['SPREAD_SHEET_SERVICE_ACCOUNT_KEY']
  SESSION = GoogleDrive::Session.from_service_account_key(KEY)
end
