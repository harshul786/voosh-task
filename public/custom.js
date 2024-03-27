document.addEventListener("DOMContentLoaded", function() {
    var observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (!mutation.addedNodes) return;
  
        for (var i = 0; i < mutation.addedNodes.length; i++) {
          // Check if the added node is the Swagger UI top bar or another element you're targeting
          var node = mutation.addedNodes[i];
          var topbar = document.getElementById("operations-Social_Login-get_auth_google");
          if (topbar) {
            // Create and append the Google Sign Up button
            var googleSignUpButton = document.createElement("button");
            googleSignUpButton.textContent = "Sign up with Google";
            googleSignUpButton.onclick = function() {
                window.open('/auth/google', '_blank');
              };
            googleSignUpButton.style.marginLeft = "50px";
            googleSignUpButton.style.backgroundColor = "red";
            googleSignUpButton.className = "opblock is-open";
  
            topbar.before(googleSignUpButton);
  
            // Once the button is added, you can disconnect the observer if you don't need it anymore
            observer.disconnect();
            return;
          }
        }
      });
    });
  
    // Configuration of the observer:
    var config = {
      childList: true,
      subtree: true
    };
  
    // Start observing the body for added nodes
    observer.observe(document.body, config);
  });
  