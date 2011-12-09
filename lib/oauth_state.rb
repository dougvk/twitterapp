require 'oauth'

class OauthState
  def initialize(secret = nil, token = nil)
    key = ENV["KEY"]
    secret = ENV["SECRET"]
    @consumer = OAuth::Consumer.new(key, secret, :site => ENV["TWITTER_API"])

    if token && secret
      self.access_token = OAuth::AccessToken.new(self.consumer, token, secret)
    end
  end

  def consumer
    @consumer
  end

  def request_token(callback)
    self.request_token = self.consumer.get_request_token(:oauth_callback => callback)
  end

  def access_token(token, token_secret, verifier)
    request_token = OAuth::RequestToken.new(self.consumer, token, token_secret)
    begin
      self.access_token = request_token.get_access_token(:oauth_verifier => verifier)
    rescue Exception => e
      Rails.logger.error e.message
    end
  end

  def access_token=(new_access_token)
    @access_token ||= new_access_token
  end

  def request_token=(new_request_token)
    @request_token ||= new_request_token
  end

  def get(path)
    Rails.logger.error "Getting #{path}"
    response = @access_token.get("/1#{path}")
    return ActiveSupport::JSON.decode(response.body)
  end

  def verify_credentials
    response = get('/account/verify_credentials.json')
    return response
  end
end
