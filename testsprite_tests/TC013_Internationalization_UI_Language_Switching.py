import asyncio
from playwright import async_api
from playwright.async_api import expect

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
        context.set_default_timeout(5000)
        
        # Open a new page in the browser context
        page = await context.new_page()
        
        # Navigate to your target URL and wait until the network request is committed
        await page.goto("http://localhost:3000", wait_until="commit", timeout=10000)
        
        # Wait for the main page to reach DOMContentLoaded state (optional for stability)
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=3000)
        except async_api.Error:
            pass
        
        # Iterate through all iframes and wait for them to load as well
        for frame in page.frames:
            try:
                await frame.wait_for_load_state("domcontentloaded", timeout=3000)
            except async_api.Error:
                pass
        
        # Interact with the page elements to simulate user flow
        # -> Click the button to switch UI language back to English.
        frame = context.pages[-1]
        # Click the button to switch UI language back to English
        elem = frame.locator('xpath=html/body/div/div/div[2]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # --> Assertions to verify final state
        frame = context.pages[-1]
        await expect(frame.locator('text=Skip to main content').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Admin').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Dashboard Utama').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Sabtu, 13 Disember 2025 • Ringkasan operasi harian').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=JUALAN HARI INI').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=BND 0.00').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Tiada pesanan lagi').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=BILANGAN PESANAN').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=0').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=↑ Semua selesai').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=STOK RENDAH').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=8').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=↓ Perlu diisi segera').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=STAF BEKERJA').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=3').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=dari 3 aktif').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Quick Actions').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Buka POS').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Cek Inventori').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Clock In/Out').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Delivery Hub').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Production').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Sales Trend').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=7 hari terakhir').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Isn').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Sel').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Rab').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Kha').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Jum').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Sab').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Aha').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=BND 0').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=BND 55').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=BND 110').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=BND 165').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=BND 220').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Inventory Levels').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Top 6 items').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Ayam').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Nasi').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Daging').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Telur').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Sambal').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Burger Bun').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Staff Attendance').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Status kehadiran hari ini').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=On Duty: 100%').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Off Duty: 0%').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=On DutyOff Duty').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Amaran Stok Rendah').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Item yang perlu diisi semula segera').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=ITEM	KUANTITI	MINIMUM	STATUS').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Ayam	45 kg	50 kg	RENDAH').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Nasi	80 kg	100 kg	RENDAH').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Daging	30 kg	40 kg	RENDAH').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Telur	120 pcs	150 pcs	RENDAH').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Sambal	15 kg	20 kg	RENDAH').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Lihat Semua Inventori').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Staf Bekerja Sekarang').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Status kehadiran semasa').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=NAMA	JAWATAN	CLOCK IN	STATUS').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Ahmad Bin Hassan	Manager	08:00	ON DUTY').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Siti Nurhaliza	Staff	09:00	ON DUTY').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Rahman Ali	Staff	08:30	ON DUTY').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Kelola HR').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=0').first).to_be_visible(timeout=30000)
        await asyncio.sleep(5)
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    