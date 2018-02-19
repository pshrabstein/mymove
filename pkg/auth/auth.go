package auth

import (
	"encoding/base64"
	"math/rand"
	"net/http"
	"net/url"
	"time"

	"go.uber.org/zap"

	"github.com/markbates/goth"
	"github.com/markbates/goth/providers/openidConnect"
)

// TODO: replace with secret store
// const jwtPrivateKeyEnvVariable = "AUTH_CLIENT_SECRET_KEY"
const loginGovClientID = "urn:gov:dod:openidconnect:sp:mymovemil"
const gothProviderType = "openid-connect"

// RegisterProvider registers Login.gov with Goth, which uses
// auto-discovery to get the OpenID configuration
func RegisterProvider(jwtSecret *string) {
	// jwtSecret, isSet := os.LookupEnv(jwtPrivateKeyEnvVariable)
	if *jwtSecret == "" {
		zap.L().Warn("Auth secret key environment variable not set")
	}

	provider, err := openidConnect.New(
		loginGovClientID,
		*jwtSecret,
		"http://localhost:3000/auth/login-gov/callback", "http://localhost:8000/.well-known/openid-configuration")

	if err != nil {
		zap.L().Error("Register Login.gov provider with Goth", zap.Error(err))
	}

	if provider != nil {
		goth.UseProviders(provider)
	}
}

// AuthorizationRedirectHandler constructs the Login.gov authentication URL and redirects to it
func AuthorizationRedirectHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		url, err := getAuthorizationURL()
		if err != nil {
			zap.L().Error("Construct Login.gov authorization URL", zap.Error(err))
			http.Error(w, http.StatusText(500), http.StatusInternalServerError)
			return
		}

		http.Redirect(w, r, url, http.StatusTemporaryRedirect)
	}
}

func getAuthorizationURL() (string, error) {
	provider, err := goth.GetProvider(gothProviderType)
	if err != nil {
		return "", err
	}
	state := generateNonce()
	sess, err := provider.BeginAuth(state)
	if err != nil {
		return "", err
	}

	baseURL, err := sess.GetAuthURL()
	if err != nil {
		return "", err
	}

	authURL, err := url.Parse(baseURL)
	if err != nil {
		return "", err
	}

	params := authURL.Query()
	params.Add("acr_values", "http://idmanagement.gov/ns/assurance/loa/1")
	params.Add("nonce", state)
	params.Set("scope", "openid email")

	authURL.RawQuery = params.Encode()
	return authURL.String(), err
}

func generateNonce() string {
	nonceBytes := make([]byte, 64)
	random := rand.New(rand.NewSource(time.Now().UnixNano()))
	for i := 0; i < 64; i++ {
		nonceBytes[i] = byte(random.Int63() % 256)
	}
	return base64.URLEncoding.EncodeToString(nonceBytes)
}
