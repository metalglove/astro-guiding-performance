<template>
  <div id="app">
    <header class="app-header">
      <div class="container">
        <div class="header-content">
          <h1 class="app-title">
            <span class="icon">🔭</span>
            Astro Guiding Performance
          </h1>
          <nav class="app-nav">
            <router-link to="/" class="nav-link">Home</router-link>
            <router-link to="/phd" class="nav-link">PHD Analysis</router-link>
            <router-link to="/equipment" class="nav-link">Equipment</router-link>
            <router-link to="/methodology" class="nav-link">Methodology</router-link>
          </nav>
        </div>
      </div>
    </header>
    <main class="main-content">
      <div class="container">
        <router-view />
      </div>
    </main>
  </div>
</template>

<style>
:root {
  --primary-color: #667eea;
  --primary-hover: #5a67d8;
  --primary-dark: #5a67d8;
  --secondary-color: #764ba2;
  --accent-color: #f093fb;
  --success-color: #48bb78;
  --warning-color: #ed8936;
  --error-color: #f56565;
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-200: #e5e7eb;
  --gray-300: #d1d5db;
  --gray-400: #9ca3af;
  --gray-500: #6b7280;
  --gray-600: #4b5563;
  --gray-700: #374151;
  --gray-800: #1f2937;
  --gray-900: #111827;
  --white: #ffffff;
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --border-radius: 0.5rem;
  --border-radius-lg: 0.75rem;
  --transition: all 0.2s ease-in-out;
  
  /* Additional variables for equipment components */
  --bg-color: #f9fafb;
  --text-color: #1f2937;
  --text-muted: #6b7280;
  --card-bg: #ffffff;
  --border-color: #e5e7eb;
  --hover-bg: #f3f4f6;
  --input-bg: #ffffff;
  --disabled-bg: #f9fafb;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  background: linear-gradient(135deg, var(--gray-50) 0%, var(--gray-100) 100%);
  min-height: 100vh;
}

#app {
  font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: var(--gray-800);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.app-header {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
  box-shadow: var(--shadow-lg);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 0;
  flex-wrap: wrap;
  gap: 1rem;
}

.app-title {
  color: var(--white);
  font-size: 1.5rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.app-title .icon {
  font-size: 2rem;
}

.app-nav {
  display: flex;
  gap: 2rem;
  align-items: center;
}

.nav-link {
  color: var(--white);
  text-decoration: none;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: var(--border-radius);
  transition: var(--transition);
  position: relative;
}

.nav-link:hover {
  background-color: rgba(255, 255, 255, 0.1);
  transform: translateY(-1px);
}

.nav-link.router-link-exact-active {
  background-color: rgba(255, 255, 255, 0.2);
  font-weight: 600;
}

.nav-link.router-link-exact-active::after {
  content: '';
  position: absolute;
  bottom: -0.25rem;
  left: 50%;
  transform: translateX(-50%);
  width: 2rem;
  height: 2px;
  background-color: var(--accent-color);
  border-radius: 1px;
}

.main-content {
  flex: 1;
  padding: 2rem 0;
}

/* Utility classes */
.card {
  background: var(--white);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow);
  padding: 1.5rem;
  transition: var(--transition);
}

.card:hover {
  box-shadow: var(--shadow-md);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: var(--border-radius);
  font-weight: 500;
  text-decoration: none;
  transition: var(--transition);
  cursor: pointer;
  gap: 0.5rem;
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
  color: var(--white);
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.btn-secondary {
  background-color: var(--gray-200);
  color: var(--gray-700);
}

.btn-secondary:hover {
  background-color: var(--gray-300);
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    text-align: center;
  }
  
  .app-nav {
    gap: 1rem;
  }
  
  .container {
    padding: 0 0.75rem;
  }
}
</style>
