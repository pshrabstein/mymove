package auth

import (
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"encoding/pem"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"time"

	"github.com/gofrs/uuid"
	"github.com/pkg/errors"
)

func createRandomRSAPEM() (s string, err error) {
	priv, err := rsa.GenerateKey(rand.Reader, 1024)
	if err != nil {
		err = errors.Wrap(err, "failed to generate key")
		return
	}

	asn1 := x509.MarshalPKCS1PrivateKey(priv)
	privBytes := pem.EncodeToMemory(&pem.Block{
		Type:  "RSA PRIVATE KEY",
		Bytes: asn1,
	})
	s = string(privBytes[:])

	return
}

func getHandlerParamsWithToken(ss string, expiry time.Time) (*httptest.ResponseRecorder, *http.Request) {
	rr := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "http://my.example.com/protected", nil)

	appName, _ := ApplicationName(req.Host, MyTestHost, OfficeTestHost, TspTestHost)

	// Set a secure cookie on the request
	cookieName := fmt.Sprintf("%s_%s", strings.ToLower(string(appName)), UserSessionCookieName)
	cookie := http.Cookie{
		Name:    cookieName,
		Value:   ss,
		Path:    "/",
		Expires: expiry,
	}
	req.AddCookie(&cookie)
	return rr, req
}

func (suite *authSuite) TestSessionCookieMiddlewareWithBadToken() {
	t := suite.T()
	fakeToken := "some_token"
	pem, err := createRandomRSAPEM()
	if err != nil {
		t.Error("error creating RSA key", err)
	}

	var resultingSession *Session
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		resultingSession = SessionFromRequestContext(r)
	})
	middleware := SessionCookieMiddleware(suite.logger, pem, false, MyTestHost, OfficeTestHost, TspTestHost)(handler)

	expiry := GetExpiryTimeFromMinutes(SessionExpiryInMinutes)
	rr, req := getHandlerParamsWithToken(fakeToken, expiry)

	middleware.ServeHTTP(rr, req)

	// We should be not be redirected since we're not enforcing auth
	suite.Equal(http.StatusOK, rr.Code, "handler returned wrong status code")

	// And there should be no token passed through
	suite.NotNil(resultingSession, "Session should not be nil")
	suite.Equal("", resultingSession.IDToken, "Expected empty IDToken from bad cookie")
}

func (suite *authSuite) TestSessionCookieMiddlewareWithValidToken() {
	t := suite.T()
	email := "some_email@domain.com"
	idToken := "fake_id_token"
	fakeUUID, _ := uuid.FromString("39b28c92-0506-4bef-8b57-e39519f42dc2")

	pem, err := createRandomRSAPEM()
	if err != nil {
		t.Fatal(err)
	}

	expiry := GetExpiryTimeFromMinutes(SessionExpiryInMinutes)
	incomingSession := Session{
		UserID:  fakeUUID,
		Email:   email,
		IDToken: idToken,
	}
	ss, err := signTokenStringWithUserInfo(expiry, &incomingSession, pem)
	if err != nil {
		t.Fatal(err)
	}
	rr, req := getHandlerParamsWithToken(ss, expiry)

	var resultingSession *Session
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		resultingSession = SessionFromRequestContext(r)
	})
	middleware := SessionCookieMiddleware(suite.logger, pem, false, MyTestHost, OfficeTestHost, TspTestHost)(handler)

	middleware.ServeHTTP(rr, req)

	// We should get a 200 OK
	suite.Equal(http.StatusOK, rr.Code, "handler returned wrong status code")

	// And there should be an ID token in the request context
	suite.NotNil(resultingSession)
	suite.Equal(idToken, resultingSession.IDToken, "handler returned wrong id_token")

	// And the cookie should be renewed
	setCookies := rr.HeaderMap["Set-Cookie"]
	suite.Equal(1, len(setCookies), "expected cookie to be set")
}

func (suite *authSuite) TestSessionCookieMiddlewareWithExpiredToken() {
	t := suite.T()
	email := "some_email@domain.com"
	idToken := "fake_id_token"
	fakeUUID, _ := uuid.FromString("39b28c92-0506-4bef-8b57-e39519f42dc2")

	pem, err := createRandomRSAPEM()
	if err != nil {
		t.Fatal(err)
	}

	expiry := GetExpiryTimeFromMinutes(-1)
	incomingSession := Session{
		UserID:  fakeUUID,
		Email:   email,
		IDToken: idToken,
	}
	ss, err := signTokenStringWithUserInfo(expiry, &incomingSession, pem)
	if err != nil {
		t.Fatal(err)
	}

	var resultingSession *Session
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		resultingSession = SessionFromRequestContext(r)
	})
	middleware := SessionCookieMiddleware(suite.logger, pem, false, MyTestHost, OfficeTestHost, TspTestHost)(handler)

	rr, req := getHandlerParamsWithToken(ss, expiry)

	middleware.ServeHTTP(rr, req)

	// We should be not be redirected since we're not enforcing auth
	suite.Equal(http.StatusOK, rr.Code, "handler returned wrong status code")

	// And there should be no token passed through
	// And there should be no token passed through
	suite.NotNil(resultingSession)
	suite.Equal("", resultingSession.IDToken, "Expected empty IDToken from expired")
	suite.Equal(uuid.Nil, resultingSession.UserID, "Expected no UUID from expired cookie")

	// And the cookie should be set
	setCookies := rr.HeaderMap["Set-Cookie"]
	suite.Equal(1, len(setCookies), "expected cookie to be set")
}

func (suite *authSuite) TestSessionCookiePR161162731() {
	t := suite.T()
	email := "some_email@domain.com"
	idToken := "fake_id_token"
	fakeUUID, _ := uuid.FromString("39b28c92-0506-4bef-8b57-e39519f42dc2")

	pem, err := createRandomRSAPEM()
	if err != nil {
		t.Fatal(err)
	}

	expiry := GetExpiryTimeFromMinutes(SessionExpiryInMinutes)
	incomingSession := Session{
		UserID:  fakeUUID,
		Email:   email,
		IDToken: idToken,
	}
	ss, err := signTokenStringWithUserInfo(expiry, &incomingSession, pem)
	if err != nil {
		t.Fatal(err)
	}
	rr, req := getHandlerParamsWithToken(ss, expiry)

	var resultingSession *Session
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		resultingSession = SessionFromRequestContext(r)
		WriteSessionCookie(w, resultingSession, "freddy", false, suite.logger)
	})
	middleware := SessionCookieMiddleware(suite.logger, pem, false, MyTestHost, OfficeTestHost, TspTestHost)(handler)

	middleware.ServeHTTP(rr, req)

	// We should get a 200 OK
	suite.Equal(http.StatusOK, rr.Code, "handler returned wrong status code")

	// And there should be an ID token in the request context
	suite.NotNil(resultingSession)
	suite.Equal(idToken, resultingSession.IDToken, "handler returned wrong id_token")

	// And the cookie should be renewed
	setCookies := rr.HeaderMap["Set-Cookie"]
	suite.Equal(1, len(setCookies), "expected cookie to be set")
}

func (suite *authSuite) TestMaskedCSRFMiddleware() {
	expiry := GetExpiryTimeFromMinutes(SessionExpiryInMinutes)

	rr := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/protected", nil)

	// Set a secure cookie on the request
	cookie := http.Cookie{
		Name:    MaskedGorillaCSRFToken,
		Value:   "fakecsrftoken",
		Path:    "/",
		Expires: expiry,
	}
	req.AddCookie(&cookie)
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {})
	middleware := MaskedCSRFMiddleware(suite.logger, false)(handler)

	middleware.ServeHTTP(rr, req)

	// We should get a 200 OK
	suite.Equal(http.StatusOK, rr.Code, "handler returned wrong status code")

	// And the cookie should be renewed
	setCookies := rr.HeaderMap["Set-Cookie"]
	suite.Equal(1, len(setCookies), "expected cookie to be set")
}
