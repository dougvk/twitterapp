module OauthWrapper

  # create a request token, set the session variables, go to oauth screen
  def oaw_login_by_oauth
    request_token = self.client.request_token(ENV["CALLBACK"])
    session[:request_token] = request_token.token
    session[:request_token_secret] = request_token.secret
    redirect_to request_token.authorize_url
  end

  def oaw_signout
    self.current_user = false
  end

  # @params: comma separated list of users to follow
  # parse the new users to follow, send list to follow helper function
  def oaw_follow(follow_list)
    token = self.current_user.token
    secret = self.current_user.secret
    self.client.access_token(token, secret)

    credentials = self.client.verify_credentials

    if follow_list
      follow_list = follow_list.split(",")
      self.client.mass_follow(follow_list)
    end
  end

  # c.f. oaw_follow
  def oaw_unfollow(unfollow_list)
    token = self.current_user.token
    secret = self.current_user.secret
    self.client.access_token(token, secret)

    credentials = self.client.verify_credentials

    if unfollow_list
      unfollow_list = unfollow_list.split(",")
      self.client.mass_unfollow(unfollow_list)
    end
    redirect_to root_path
  end

  # @params: verifier (sent back by the oauth provider during callback)
  # @params: token (to make sure the token from session matches oauths)
  # creates access token from callback params, saves/updates user and session
  def oaw_callback(verifier, token)
    # tokens match?
    if (token != session[:request_token])
      raise"Tokens don't match"
    end

    # credentials verified?
    self.client.get_access_token(session[:request_token], session[:request_token_secret], verifier)
    credentials = self.client.verify_credentials

    # update/create user for future API calls, etc.
    @user = User.find_by_screen_name(credentials['screen_name'])
    if @user
      @user.token = self.client.access_token.token
      @user.secret = self.client.access_token.secret
      @user.image_url = credentials['profile_image_url']
    else
      @user = User.new({
        :twitter_id => credentials['id'],
        :screen_name => credentials['screen_name'],
        :token => self.client.access_token.token,
        :secret => self.client.access_token.secret,
        :image_url => credentials['profile_image_url']})
    end

    if @user.save!
      self.current_user = @user
    else
      raise "Couldn't save the user"
    end

    redirect_to user_path(self.current_user)
  rescue Exception => e
    Rails.logger.error "ERROR CALLBACK: " + e.message
    redirect_to root_url
  end

  # send these methods for use as helper methods in templates
  def self.included(base)
    base.send :helper_method, :current_user, :logged_in? if base.respond_to? :helper_method
  end


  # <--- vanilla getter/setter functions --->



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
      self.client(token=new_user.token, secret=new_user.secret)
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
    @client = new_client
  end

  def login_from_session
    self.current_user = User.find_by_twitter_id(session[:twitter_id]) if session[:twitter_id]
  end
end
