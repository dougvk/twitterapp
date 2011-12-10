module OauthWrapper
  def oaw_login_by_oauth
    request_token = self.client.request_token(ENV["CALLBACK"])
    session[:request_token] = request_token.token
    session[:request_token_secret] = request_token.secret
    redirect_to request_token.authorize_url
  end

  def oaw_signout
    self.current_user = false
  end

  def oaw_callback(verifier, token)
    self.client.get_access_token(session[:request_token], session[:request_token_secret], verifier)
    credentials = self.client.verify_credentials

    @user = User.find_by_screen_name(credentials['screen_name'])
    if @user
      @user.token = self.client.access_token.token
      @user.secret = self.client.access_token.secret
      @user.image_url = credentials['profile_image_url']
    else
      @user = User.new({
        :twitter_id => credentials['id'],
        :screen_name => credentials['name'],
        :token => access_token.token,
        :secret => access_token.secret,
        :image_url => credentials['profile_image_url']})
    end

    if @user.save!
      self.current_user = @user
    else
      raise "Couldn't save the user"
    end

    redirect_to user_path(self.current_user)
  rescue Exception => e
    Rails.logger.error e.message
    redirect_to root_url
  end

  def self.included(base)
    base.send :helper_method, :current_user, :logged_in? if base.respond_to? :helper_method
  end

  def logged_in?
    return self.current_user
  end

  def current_user
    if @current_user != false
      @current_user ||= (login_from_session)
    end
    return @current_user
  end

  def current_user=(new_user)
    if new_user
      session[:twitter_id] = new_user.twitter_id
      self.client = OauthState.new(new_user.token, new_user.secret)
      @current_user = new_user
    else
      session[:request_token] = nil
      session[:request_token_secret] = nil
      session[:twitter_id] = nil
      self.client = false
      @current_user = false
    end
  end

  def client(token = nil, secret = nil)
    if token && secret
      self.client = OauthState.new(token, secret)
    elsif not @client
      self.client = OauthState.new()
    end
    return @client
  end

  def client=(new_client)
    @client ||= new_client
  end

  def login_from_session
    self.current_user = User.find_by_twitter_id(session[:twitter_id]) if session[:twitter_id]
  end
end
