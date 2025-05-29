# ComplyArk DPDPA Management Platform - Windows MSSQL Setup Guide

## Overview
This guide provides step-by-step instructions to migrate the ComplyArk application from PostgreSQL to Microsoft SQL Server and run it locally on Windows using Visual Studio Code.

## Prerequisites

### Required Software
1. **Node.js** (v18.0.0 or higher)
   - Download from: https://nodejs.org/
   - Choose LTS version

2. **Microsoft SQL Server**
   - SQL Server 2019 Express (free) or higher
   - Download from: https://www.microsoft.com/en-us/sql-server/sql-server-downloads
   - Choose "Express" for local development

3. **SQL Server Management Studio (SSMS)**
   - Download from: https://docs.microsoft.com/en-us/sql/ssms/download-sql-server-management-studio-ssms
   - Required for database management

4. **Visual Studio Code**
   - Download from: https://code.visualstudio.com/
   - Install recommended extensions:
     - SQL Server (mssql)
     - TypeScript and JavaScript Language Features
     - REST Client (for API testing)

5. **Git** (if cloning from repository)
   - Download from: https://git-scm.com/

## Installation Steps

### Step 1: Install SQL Server
1. Download SQL Server 2019 Express
2. Run the installer and choose "Basic" installation
3. Note the server instance name (usually `SQLEXPRESS`)
4. Enable SQL Server Authentication if not already enabled
5. Create a login for the application:
   - Username: `complyark_user`
   - Password: `ComplyArk@2024`

### Step 2: Install SQL Server Management Studio
1. Download and install SSMS
2. Connect to your SQL Server instance
3. Create a new database named `ComplyArkDB`

### Step 3: Set Up the Database Schema
1. Open SSMS and connect to your SQL Server instance
2. Right-click on "Databases" → "New Database"
3. Name it `ComplyArkDB`
4. Execute the schema creation script: `01-create-schema.sql`
5. Execute the sample data script: `02-insert-sample-data.sql`

### Step 4: Configure the Application
1. Clone or copy the application code to your local machine
2. Open the project in Visual Studio Code
3. Copy `.env.example` to `.env`
4. Update the `.env` file with your SQL Server connection details

### Step 5: Install Dependencies
1. Open terminal in VS Code
2. Run: `npm install`
3. Install MSSQL packages: `npm install mssql @types/mssql`

### Step 6: Run the Application
1. In VS Code terminal, run: `npm run dev`
2. Open browser to `http://localhost:5000`

## Default Login Credentials

### Super Admin
- Username: `admin`
- Password: `admin123`

### Organization Admin (Organization ID: 31)
- Username: `orgadmin`
- Password: `orgadmin123`

### Regular User (Organization ID: 31)
- Username: `user`
- Password: `user123`