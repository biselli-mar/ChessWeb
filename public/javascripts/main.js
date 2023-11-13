/*!
 * Color mode toggler for Bootstrap's docs (https://getbootstrap.com/)
 * Copyright 2011-2023 The Bootstrap Authors
 * Licensed under the Creative Commons Attribution 3.0 Unported License.
 */

(() => {
    'use strict'

    const lightIcon = 'bi-brightness-high'
    const darkIcon = 'bi-moon-stars'
    
    const themeSwitcher = document.querySelector('#color-mode-switch')

    if (themeSwitcher) {
      themeSwitcher.addEventListener('click', () => {
        const theme = themeSwitcher.checked ? 'dark' : 'light'
        setStoredTheme(theme)
        setTheme(theme)
        showActiveTheme(theme)
      })
    }
  
    const getStoredTheme = () => localStorage.getItem('theme')
    const setStoredTheme = theme => localStorage.setItem('theme', theme)
  
    const getPreferredTheme = () => {
      const storedTheme = getStoredTheme()
      if (storedTheme) {
        return storedTheme
      }
  
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
  
    const setTheme = theme => {
      if (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.setAttribute('data-bs-theme', 'dark')
      } else {
        document.documentElement.setAttribute('data-bs-theme', theme)
      }
    }
  
    setTheme(getPreferredTheme())
  
    const showActiveTheme = (theme) => {
  
      if (!themeSwitcher) {
        return
      }

      const themeIcon = document.querySelector('#color-mode-icon')
  
      document.querySelectorAll('[data-bs-theme-value]').forEach(element => {
        element.classList.remove('active')
        element.setAttribute('aria-pressed', 'false')
      })
  
      if (theme === 'dark') {
        // Set themeSwitcher checkbox to checked
        themeSwitcher.checked = true
        themeIcon.classList.remove(lightIcon)
        themeIcon.classList.add(darkIcon)
      } else {
        themeSwitcher.checked = false
        themeIcon.classList.remove(darkIcon)
        themeIcon.classList.add(lightIcon)
      }
  
      if (focus) {
        themeSwitcher.focus()
      }
    }
  
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      const storedTheme = getStoredTheme()
      if (storedTheme !== 'light' && storedTheme !== 'dark') {
        setTheme(getPreferredTheme())
      }
    })
  
    window.addEventListener('DOMContentLoaded', () => {
      showActiveTheme(getPreferredTheme())
  
      document.querySelectorAll('[data-bs-theme-value]')
        .forEach(toggle => {
          toggle.addEventListener('click', () => {
            const theme = toggle.getAttribute('data-bs-theme-value')
            setStoredTheme(theme)
            setTheme(theme)
            showActiveTheme(theme)
          })
        })
    })
  })()
  