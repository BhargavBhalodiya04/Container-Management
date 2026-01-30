document.addEventListener('DOMContentLoaded', function() {
  const registerForm = document.getElementById('registerForm');
  const togglePassword = document.getElementById('togglePassword');
  const passwordInput = document.getElementById('password');
  const eyeIcon = document.getElementById('eyeIcon');
  const eyeSlashIcon = document.getElementById('eyeSlashIcon');
  
  // Initialize eye icons
  eyeSlashIcon.style.display = 'none';
  
  // Password visibility toggle
  togglePassword.addEventListener('click', function() {
    if (passwordInput.type === 'password') {
      passwordInput.type = 'text';
      eyeIcon.style.display = 'none';
      eyeSlashIcon.style.display = 'block';
    } else {
      passwordInput.type = 'password';
      eyeIcon.style.display = 'block';
      eyeSlashIcon.style.display = 'none';
    }
  });
  
  // Form submission handler
  registerForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Get form data
    const formData = {
      firstName: document.getElementById('firstName').value.trim(),
      lastName: document.getElementById('lastName').value.trim(),
      username: document.getElementById('username').value.trim(),
      email: document.getElementById('email').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      department: document.getElementById('department').value,
      password: document.getElementById('password').value,
      confirmPassword: document.getElementById('confirmPassword').value,
      terms: document.getElementById('terms').checked
    };
    
    // Validation
    const validationError = validateForm(formData);
    if (validationError) {
      showError(validationError);
      return;
    }
    
    // Show loading state
    const submitButton = registerForm.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.innerHTML;
    submitButton.innerHTML = `
      <div class="flex items-center justify-center">
        <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Creating account...
      </div>
    `;
    submitButton.disabled = true;
    
    try {
      // Send registration request
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: formData.firstName,
          last_name: formData.lastName,
          username: formData.username,
          email: formData.email,
          phone: formData.phone,
          department: formData.department,
          password: formData.password
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Registration failed');
      }
      
      // Success - show confirmation and redirect
      showSuccess('Account created successfully! Redirecting to login...');
      
      // Redirect to login page after 2 seconds
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 2000);
      
    } catch (error) {
      showError(error.message);
    } finally {
      // Reset button state
      submitButton.innerHTML = originalButtonText;
      submitButton.disabled = false;
    }
  });
  
  // Real-time validation
  document.getElementById('username').addEventListener('blur', async function() {
    const username = this.value.trim();
    if (username.length > 0) {
      await checkUsernameAvailability(username);
    }
  });
  
  document.getElementById('email').addEventListener('blur', async function() {
    const email = this.value.trim();
    if (email.length > 0) {
      await checkEmailValidity(email);
    }
  });
  
  document.getElementById('password').addEventListener('input', function() {
    validatePasswordStrength(this.value);
  });
  
  document.getElementById('confirmPassword').addEventListener('input', function() {
    const password = document.getElementById('password').value;
    const confirmPassword = this.value;
    if (confirmPassword.length > 0) {
      validatePasswordMatch(password, confirmPassword);
    }
  });
});

// Form validation function
function validateForm(data) {
  // Required field checks
  if (!data.firstName) return 'First name is required';
  if (!data.lastName) return 'Last name is required';
  if (!data.username) return 'Username is required';
  if (!data.email) return 'Email is required';
  if (!data.password) return 'Password is required';
  if (!data.confirmPassword) return 'Please confirm your password';
  if (!data.terms) return 'You must agree to the terms and conditions';
  
  // Username validation
  if (data.username.length < 3) return 'Username must be at least 3 characters long';
  if (!/^[a-zA-Z0-9_]+$/.test(data.username)) return 'Username can only contain letters, numbers, and underscores';
  
  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) return 'Please enter a valid email address';
  
  // Phone validation (if provided)
  if (data.phone && !/^[+]?[\d\s\-\(\)]+$/.test(data.phone)) {
    return 'Please enter a valid phone number';
  }
  
  // Password validation
  if (data.password.length < 6) return 'Password must be at least 6 characters long';
  if (data.password !== data.confirmPassword) return 'Passwords do not match';
  
  return null; // No validation errors
}

// Check username availability
async function checkUsernameAvailability(username) {
  try {
    const response = await fetch(`/api/check-username?username=${encodeURIComponent(username)}`);
    const result = await response.json();
    
    const usernameField = document.getElementById('username');
    const parent = usernameField.closest('.relative');
    
    // Remove existing feedback
    const existingFeedback = parent.querySelector('.username-feedback');
    if (existingFeedback) {
      existingFeedback.remove();
    }
    
    if (result.exists) {
      const feedback = document.createElement('p');
      feedback.className = 'username-feedback text-sm text-red-600 mt-2';
      feedback.textContent = 'Username is already taken';
      parent.appendChild(feedback);
      usernameField.classList.add('border-red-500');
      usernameField.classList.remove('border-green-500');
    } else if (username.length >= 3) {
      const feedback = document.createElement('p');
      feedback.className = 'username-feedback text-sm text-green-600 mt-2';
      feedback.textContent = 'Username is available';
      parent.appendChild(feedback);
      usernameField.classList.add('border-green-500');
      usernameField.classList.remove('border-red-500');
    }
  } catch (error) {
    console.error('Error checking username:', error);
  }
}

// Check email validity
async function checkEmailValidity(email) {
  try {
    const response = await fetch(`/api/check-email?email=${encodeURIComponent(email)}`);
    const result = await response.json();
    
    const emailField = document.getElementById('email');
    const parent = emailField.closest('.relative');
    
    // Remove existing feedback
    const existingFeedback = parent.querySelector('.email-feedback');
    if (existingFeedback) {
      existingFeedback.remove();
    }
    
    if (result.exists) {
      const feedback = document.createElement('p');
      feedback.className = 'email-feedback text-sm text-red-600 mt-2';
      feedback.textContent = 'Email is already registered';
      parent.appendChild(feedback);
      emailField.classList.add('border-red-500');
      emailField.classList.remove('border-green-500');
    } else {
      emailField.classList.add('border-green-500');
      emailField.classList.remove('border-red-500');
    }
  } catch (error) {
    console.error('Error checking email:', error);
  }
}

// Validate password strength
function validatePasswordStrength(password) {
  const strengthIndicator = document.getElementById('password-strength');
  const confirmPassword = document.getElementById('confirmPassword');
  const passwordParent = document.getElementById('password').closest('.relative');
  
  // Remove existing strength indicator
  if (strengthIndicator) {
    strengthIndicator.remove();
  }
  
  if (password.length === 0) return;
  
  let strength = 0;
  let feedback = '';
  
  // Length check
  if (password.length >= 6) strength++;
  if (password.length >= 8) strength++;
  
  // Character variety checks
  if (/[a-z]/.test(password)) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^a-zA-Z0-9]/.test(password)) strength++;
  
  // Create strength indicator
  const indicator = document.createElement('div');
  indicator.id = 'password-strength';
  indicator.className = 'mt-2 text-sm';
  
  if (strength <= 2) {
    indicator.className += ' text-red-600';
    feedback = 'Weak password';
  } else if (strength <= 4) {
    indicator.className += ' text-yellow-600';
    feedback = 'Medium password';
  } else {
    indicator.className += ' text-green-600';
    feedback = 'Strong password';
  }
  
  indicator.textContent = feedback;
  
  // Insert after the password field's parent div
  passwordParent.parentNode.insertBefore(indicator, passwordParent.nextSibling);
  
  // Check password match if confirm password has value
  if (confirmPassword.value) {
    validatePasswordMatch(password, confirmPassword.value);
  }
}

// Validate password match
function validatePasswordMatch(password, confirmPassword) {
  const confirmPasswordField = document.getElementById('confirmPassword');
  const parent = confirmPasswordField.closest('.relative');
  
  // Remove existing feedback
  const existingFeedback = parent.parentNode.querySelector('.password-match-feedback');
  if (existingFeedback) {
    existingFeedback.remove();
  }
  
  if (confirmPassword.length === 0) return;
  
  const feedback = document.createElement('p');
  feedback.className = 'password-match-feedback text-sm mt-2';
  
  if (password === confirmPassword) {
    feedback.className += ' text-green-600';
    feedback.textContent = 'Passwords match';
    confirmPasswordField.classList.add('border-green-500');
    confirmPasswordField.classList.remove('border-red-500');
  } else {
    feedback.className += ' text-red-600';
    feedback.textContent = 'Passwords do not match';
    confirmPasswordField.classList.add('border-red-500');
    confirmPasswordField.classList.remove('border-green-500');
  }
  
  // Insert after the confirm password field's parent div
  parent.parentNode.insertBefore(feedback, parent.nextSibling);
}

// Show error message
function showError(message) {
  // Remove existing error messages
  const existingErrors = document.querySelectorAll('#register-error');
  existingErrors.forEach(el => el.remove());
  
  const form = document.getElementById('registerForm');
  const errorDiv = document.createElement('div');
  errorDiv.id = 'register-error';
  errorDiv.className = 'rounded-lg bg-red-50 border border-red-200 p-4 mb-6'; // Increased margin-bottom
  
  errorDiv.innerHTML = `
    <div class="flex">
      <div class="flex-shrink-0">
        <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
        </svg>
      </div>
      <div class="ml-3">
        <h3 class="text-sm font-medium text-red-800">${message}</h3>
      </div>
    </div>
  `;
  
  // Insert at the beginning of the form
  form.insertBefore(errorDiv, form.firstChild);
  
  // Scroll to error
  errorDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  
  // Clear the error message after 5 seconds
  setTimeout(() => {
    if (errorDiv.parentNode) {
      errorDiv.parentNode.removeChild(errorDiv);
    }
  }, 5000);
}

// Show success message
function showSuccess(message) {
  // Remove existing success messages
  const existingSuccess = document.querySelectorAll('#register-success');
  existingSuccess.forEach(el => el.remove());
  
  const form = document.getElementById('registerForm');
  const successDiv = document.createElement('div');
  successDiv.id = 'register-success';
  successDiv.className = 'rounded-lg bg-green-50 border border-green-200 p-4 mb-6'; // Increased margin-bottom
  
  successDiv.innerHTML = `
    <div class="flex">
      <div class="flex-shrink-0">
        <svg class="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
        </svg>
      </div>
      <div class="ml-3">
        <h3 class="text-sm font-medium text-green-800">${message}</h3>
      </div>
    </div>
  `;
  
  // Insert at the beginning of the form
  form.insertBefore(successDiv, form.firstChild);
  
  // Scroll to success message
  successDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}