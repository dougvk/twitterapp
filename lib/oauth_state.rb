require 'oauth'

class OauthState

  # create oauth consumer service from nothing (or existing session)
  def initialize(token = nil, secret = nil)
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

  # creates the request token with given callback url
  def request_token(callback)
    self.request_token = self.consumer.get_request_token(:oauth_callback => callback)
  end

  # gets the access token from the verifier and the token/secret from session
  def get_access_token(request_token, request_token_secret, oauth_verifier)
    request_token = OAuth::RequestToken.new(self.consumer, request_token, request_token_secret)
    self.access_token = request_token.get_access_token(:oauth_verifier => oauth_verifier)
  end

  # access token getter method
  def access_token(token = nil, secret = nil)
    if token && secret
      self.access_token = OAuth::AccessToken.new(self.consumer, token, secret)
    else
      @access_token
    end
  end

  # access token setter method
  def access_token=(new_access_token)
    @access_token = new_access_token
  end

  # request token setter method
  def request_token=(new_request_token)
    @request_token = new_request_token
  end

  # @params: path, the api call to make
  # calls the version 1 api with GET
  def get(path)
    response = self.access_token.get("/1#{path}")
    return ActiveSupport::JSON.decode(response.body)
  end

  # @params: path, the api call to make
  # calls the version 1 api with POST
  def post(path)
    response = self.access_token.post("/1#{path}")
    return ActiveSupport::JSON.decode(response.body)
  end

  # API call for verify credentials
  def verify_credentials
    response = get('/account/verify_credentials.json')
    return response
  end

  # makes a slew of API calls for the number of users in the follow list
  def mass_follow(follow_list)
    follow_list.each do |to_follow|
      path = "/friendships/create.json?screen_name=#{to_follow}"
    end
  end

  # makes a slew of API calls for the number of users in the unfollow list
  def mass_unfollow(unfollow_list)
    unfollow_list.each do |to_unfollow|
      path = "/friendships/destroy.json?screen_name=#{to_unfollow}"
    end
  end
end
