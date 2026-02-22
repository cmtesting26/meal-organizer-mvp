@echo off
REM Meal Organizer MVP - Quick Setup Script (Windows)

echo 🚀 Setting up Meal Organizer MVP...
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo 📦 Installing npm dependencies...
    call npm install
    echo ✅ Dependencies installed!
    echo.
)

REM Check if .env exists
if not exist ".env" (
    echo ⚙️  Creating .env file...
    copy .env.example .env
    echo ✅ .env created! Remember to add your CORS proxy URL later.
    echo.
)

REM Initialize shadcn/ui
echo 🎨 Initializing shadcn/ui...
echo    When prompted, choose:
echo    - Style: Default
echo    - Base color: Slate
echo    - CSS variables: Yes
echo    - Tailwind config: Yes
echo    - Import alias: @/*
echo.
call npx shadcn-ui@latest init --yes --defaults

REM Install all required components
echo.
echo 📦 Installing UI components...

call npx shadcn-ui@latest add sheet --yes --overwrite
call npx shadcn-ui@latest add dialog --yes --overwrite
call npx shadcn-ui@latest add button --yes --overwrite
call npx shadcn-ui@latest add input --yes --overwrite
call npx shadcn-ui@latest add textarea --yes --overwrite
call npx shadcn-ui@latest add label --yes --overwrite
call npx shadcn-ui@latest add alert --yes --overwrite
call npx shadcn-ui@latest add card --yes --overwrite
call npx shadcn-ui@latest add badge --yes --overwrite

echo.
echo ✅ All components installed!
echo.
echo 🎉 Setup complete!
echo.
echo To start the development server:
echo   npm run dev
echo.
echo Then visit: http://localhost:5173
echo.
pause
