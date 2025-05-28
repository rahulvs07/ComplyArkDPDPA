#!/usr/bin/env python3
"""
IndicTrans2 Integration Demo Script

This script demonstrates the complete translation system integration
for the ComplyArk DPDPA compliance platform.
"""

import json
import subprocess
import sys

def run_translation_demo():
    """Run a comprehensive demo of the translation system."""
    
    print("🌟 IndicTrans2 Translation System Demo")
    print("=" * 50)
    
    # Sample privacy notice text for demonstration
    sample_notice = """
    PRIVACY NOTICE
    
    This privacy notice explains how we collect, use, store, and protect your personal data 
    when you use our services. We are committed to ensuring your privacy rights are respected 
    in accordance with applicable data protection laws.
    
    Data Collection: We collect information you provide directly to us, such as when you 
    create an account, make a request, or contact us for support.
    
    Data Usage: We use your personal data to provide and improve our services, respond to 
    your inquiries, and comply with legal obligations.
    
    Data Protection: We implement appropriate technical and organizational measures to 
    protect your personal data against unauthorized access, alteration, disclosure, or destruction.
    """
    
    # Languages to demonstrate
    demo_languages = [
        ("hin_Deva", "Hindi"),
        ("tam_Taml", "Tamil"), 
        ("ben_Beng", "Bengali"),
        ("mal_Mlym", "Malayalam"),
        ("guj_Gujr", "Gujarati"),
        ("tel_Telu", "Telugu")
    ]
    
    print("\n📋 Original Notice (English):")
    print("-" * 30)
    print(sample_notice[:200] + "...")
    
    print(f"\n🔄 Translating to {len(demo_languages)} Indian Languages:")
    print("-" * 50)
    
    for lang_code, lang_name in demo_languages:
        try:
            # Run translation using our script
            result = subprocess.run([
                "python3", "scripts/translate.py",
                "--text", sample_notice[:300],  # Truncate for demo
                "--target_lang", lang_code
            ], capture_output=True, text=True, timeout=30)
            
            if result.returncode == 0:
                translated_text = result.stdout.strip()
                print(f"\n🌐 {lang_name} ({lang_code}):")
                print(f"   {translated_text[:150]}...")
            else:
                print(f"\n❌ {lang_name}: Translation failed")
                
        except subprocess.TimeoutExpired:
            print(f"\n⏰ {lang_name}: Translation timeout")
        except Exception as e:
            print(f"\n❌ {lang_name}: Error - {e}")
    
    print("\n" + "=" * 50)
    print("✅ Translation Demo Complete!")
    print("\n📊 System Capabilities:")
    print("   • 22 Indian languages supported")
    print("   • Real-time translation processing") 
    print("   • Database storage for translated notices")
    print("   • Progress tracking for model downloads")
    print("   • Both simulation and actual model modes")
    
    # Check model status
    try:
        result = subprocess.run([
            "python3", "scripts/translate.py", "--check_models"
        ], capture_output=True, text=True)
        
        if result.returncode == 0:
            model_status = json.loads(result.stdout)
            print(f"\n🔧 Model Status:")
            print(f"   Models Ready: {'✅' if model_status['all_ready'] else '⚠️ Simulation Mode'}")
            for model_type, available in model_status['models_available'].items():
                status = "✅ Ready" if available else "📥 Download Required"
                print(f"   {model_type}: {status}")
    except:
        print("\n🔧 Model Status: Unable to check")

if __name__ == "__main__":
    run_translation_demo()