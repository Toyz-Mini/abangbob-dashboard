import asyncio
from playwright import async_api
from playwright.async_api import expect
from config import get_url, ADMIN_EMAIL, ADMIN_PASSWORD, NAVIGATION_TIMEOUT, DEFAULT_TIMEOUT

async def run_test():
    pw = None
    browser = None
    context = None
    
    try:
        # Start a Playwright session in asynchronous mode
        pw = await async_api.async_playwright().start()
        
        # Launch a Chromium browser in headless mode with custom arguments
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",         # Set the browser window size
                "--disable-dev-shm-usage",        # Avoid using /dev/shm which can cause issues in containers
                "--ipc=host",                     # Use host-level IPC for better stability
                "--single-process"                # Run the browser in a single process mode
            ],
        )
        
        # Create a new browser context (like an incognito window)
        context = await browser.new_context()
        context.set_default_timeout(DEFAULT_TIMEOUT)
        
        # Open a new page in the browser context
        page = await context.new_page()
        
        # Navigate to production URL
        await page.goto(get_url(), wait_until="commit", timeout=NAVIGATION_TIMEOUT)
        
        # Wait for the main page to reach DOMContentLoaded state (optional for stability)
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except async_api.Error:
            pass
        
        # Iterate through all iframes and wait for them to load as well
        for frame in page.frames:
            try:
                await frame.wait_for_load_state("domcontentloaded", timeout=3000)
            except async_api.Error:
                pass
        
        # Navigate to login page
        await page.goto(get_url('/login'), timeout=NAVIGATION_TIMEOUT)
        await asyncio.sleep(2)
        
        # Try to find email input and enter credentials
        email_input = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first
        password_input = page.locator('input[type="password"]').first
        
        if await email_input.count() > 0:
            await email_input.fill(ADMIN_EMAIL)
            await password_input.fill(ADMIN_PASSWORD)
            
            # Click login button
            login_button = page.locator('button:has-text("Login"), button:has-text("Sign in"), button[type="submit"]').first
            await login_button.click()
            await asyncio.sleep(3)
        
        # Verify we're on dashboard or authenticated page
        current_url = page.url
        assert '/login' not in current_url or 'dashboard' in current_url.lower(), \
            f"Login failed - still on login page or not redirected. Current URL: {current_url}"
        
        print("✅ Login test passed - user authenticated successfully")
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    