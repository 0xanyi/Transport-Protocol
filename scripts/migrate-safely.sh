#!/bin/bash

echo "🚀 STPPL Transport Protocol - Safe Database Migration"
echo "================================================"
echo ""
echo "This script will safely add the 'dropoff_photos' column to your vehicles table."
echo "⚠️  IMPORTANT: This is designed to be 100% safe for production data."
echo ""
echo "What this migration does:"
echo "✅ Adds 'dropoff_photos' column ONLY if it doesn't exist"
echo "✅ Does NOT modify any existing data"
echo "✅ Does NOT delete or alter existing columns"
echo "✅ All existing vehicle records remain unchanged"
echo ""
echo "The SQL that will be executed:"
echo "--------------------------------"
cat supabase/migrations/add_dropoff_photos.sql
echo ""
echo "--------------------------------"
echo ""
read -p "Do you want to proceed with this migration? (y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔧 Applying migration..."
    echo ""
    echo "Please run this SQL command in your Supabase SQL Editor:"
    echo "https://supabase.com/dashboard/project/$(echo $NEXT_PUBLIC_SUPABASE_URL | sed 's/.*\/\/\([^.]*\).*/\1/')/sql"
    echo ""
    echo "Copy and paste this SQL:"
    echo "========================"
    cat supabase/migrations/add_dropoff_photos.sql
    echo "========================"
    echo ""
    echo "After running the SQL in Supabase:"
    echo "✅ Your vehicle management will support dropoff photos"
    echo "✅ All existing data will remain intact"
    echo "✅ New vehicles can have both pickup and dropoff photos"
    echo ""
else
    echo "❌ Migration cancelled. Your database remains unchanged."
    echo ""
    echo "You can run this script again anytime."
    echo "Vehicle management will work normally without this migration,"
    echo "but dropoff photos won't be available until the migration is applied."
fi

echo ""
echo "Need help? Check docs/R2_SETUP.md for complete setup instructions."
