#!/usr/bin/env python3
"""
IndicTrans2 Translation Script

This script provides a command-line interface for translating text
using the IndicTrans2 model. It supports all 22 scheduled Indian languages.
Can work in both simulation mode and actual model mode.

Usage:
  python translate.py --text "Text to translate" --target_lang "hin_Deva"
  python translate.py --text "Text to translate" --target_lang "hin_Deva" --use_model
"""

import argparse
import json
import sys
import os
from pathlib import Path

def get_supported_languages():
    """Return a list of supported languages."""
    return [
        {"code": "asm_Beng", "name": "Assamese"},
        {"code": "ben_Beng", "name": "Bengali"},
        {"code": "brx_Deva", "name": "Bodo"},
        {"code": "doi_Deva", "name": "Dogri"},
        {"code": "eng_Latn", "name": "English"},
        {"code": "gom_Deva", "name": "Konkani"},
        {"code": "guj_Gujr", "name": "Gujarati"},
        {"code": "hin_Deva", "name": "Hindi"},
        {"code": "kan_Knda", "name": "Kannada"},
        {"code": "kas_Arab", "name": "Kashmiri (Arabic)"},
        {"code": "kas_Deva", "name": "Kashmiri (Devanagari)"},
        {"code": "mai_Deva", "name": "Maithili"},
        {"code": "mal_Mlym", "name": "Malayalam"},
        {"code": "mar_Deva", "name": "Marathi"},
        {"code": "mni_Beng", "name": "Manipuri (Bengali)"},
        {"code": "mni_Mtei", "name": "Manipuri (Meitei)"},
        {"code": "npi_Deva", "name": "Nepali"},
        {"code": "ory_Orya", "name": "Odia"},
        {"code": "pan_Guru", "name": "Punjabi"},
        {"code": "san_Deva", "name": "Sanskrit"},
        {"code": "sat_Olck", "name": "Santali"},
        {"code": "snd_Arab", "name": "Sindhi (Arabic)"},
        {"code": "snd_Deva", "name": "Sindhi (Devanagari)"},
        {"code": "tam_Taml", "name": "Tamil"},
        {"code": "tel_Telu", "name": "Telugu"},
        {"code": "urd_Arab", "name": "Urdu"}
    ]

def check_model_availability():
    """Check if IndicTrans2 models are available locally."""
    models_dir = Path(__file__).parent.parent / "models" / "translation"
    
    required_models = ["en-indic", "indic-en", "indic-indic"]
    available_models = {}
    
    for model_type in required_models:
        model_path = models_dir / model_type
        config_file = model_path / "config.json"
        available_models[model_type] = config_file.exists()
    
    return available_models

def translate_with_model(text, target_lang, source_lang="eng_Latn"):
    """
    Translate text using the actual IndicTrans2 model.
    
    Args:
        text: Text to translate
        target_lang: Target language code
        source_lang: Source language code
    
    Returns:
        Translated text
    """
    try:
        # Try importing the required libraries
        from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
        import torch
        
        # Determine which model to use
        if source_lang == "eng_Latn" and target_lang != "eng_Latn":
            model_type = "en-indic"
        elif source_lang != "eng_Latn" and target_lang == "eng_Latn":
            model_type = "indic-en"
        else:
            model_type = "indic-indic"
        
        # Load the model
        models_dir = Path(__file__).parent.parent / "models" / "translation"
        model_path = models_dir / model_type
        
        if not model_path.exists():
            raise FileNotFoundError(f"Model {model_type} not found at {model_path}")
        
        tokenizer = AutoTokenizer.from_pretrained(str(model_path))
        model = AutoModelForSeq2SeqLM.from_pretrained(str(model_path))
        
        # Prepare input with language tags
        if model_type in ["en-indic", "indic-indic"]:
            input_text = f">>{target_lang}<< {text}"
        else:
            input_text = text
        
        # Tokenize and translate
        inputs = tokenizer(input_text, return_tensors="pt", max_length=512, truncation=True)
        
        with torch.no_grad():
            outputs = model.generate(**inputs, max_length=512, num_beams=4, early_stopping=True)
        
        translated_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
        return translated_text
        
    except ImportError as e:
        raise ImportError(f"Required libraries not installed: {e}")
    except Exception as e:
        raise Exception(f"Translation failed: {e}")

def simulate_translation(text, target_lang):
    """
    Simulate translation for demonstration purposes.
    
    Args:
        text: Text to translate
        target_lang: Target language code
    
    Returns:
        Simulated translated text
    """
    languages = {lang["code"]: lang["name"] for lang in get_supported_languages()}
    target_name = languages.get(target_lang, target_lang)
    
    # For demonstration purposes, just simulate a translation
    prefix = f"[{target_name} Translation] "
    
    # Add some basic transformations based on the language to make it look different
    if target_lang == "hin_Deva":
        # Add some Hindi-looking text
        return prefix + "यह एक अनुवादित नोटिस है। " + text[:100] + "..."
    elif target_lang == "tam_Taml":
        # Add some Tamil-looking text
        return prefix + "இது மொழிபெயர்க்கப்பட்ட அறிவிப்பு. " + text[:100] + "..."
    elif target_lang == "ben_Beng":
        # Add some Bengali-looking text
        return prefix + "এটি একটি অনুবাদিত নোটিশ। " + text[:100] + "..."
    elif target_lang == "mal_Mlym":
        # Add some Malayalam-looking text
        return prefix + "ഇത് ഒരു വിവർത്തനം ചെയ്ത നോട്ടീസ് ആണ്. " + text[:100] + "..."
    else:
        # For other languages, just return the original with a prefix
        return prefix + text[:100] + "..."

def main():
    """Main function to handle command-line arguments."""
    parser = argparse.ArgumentParser(description="Translate text using IndicTrans2 model")
    
    parser.add_argument("--text", type=str, help="Text to translate")
    parser.add_argument("--target_lang", type=str, help="Target language code (e.g., 'hin_Deva')")
    parser.add_argument("--source_lang", type=str, default="eng_Latn", help="Source language code")
    parser.add_argument("--use_model", action="store_true", help="Use actual model instead of simulation")
    parser.add_argument("--list_languages", action="store_true", help="List supported languages")
    parser.add_argument("--check_models", action="store_true", help="Check model availability")
    
    args = parser.parse_args()
    
    # Handle utility commands
    if args.list_languages:
        languages = get_supported_languages()
        print(json.dumps(languages, indent=2))
        return
    
    if args.check_models:
        availability = check_model_availability()
        print(json.dumps({
            "models_available": availability,
            "all_ready": all(availability.values())
        }, indent=2))
        return
    
    # Handle translation commands
    if args.text and args.target_lang:
        try:
            if args.use_model:
                # Try to use the actual model
                availability = check_model_availability()
                if not any(availability.values()):
                    print("ERROR: No models are available. Please download models first.")
                    sys.exit(1)
                
                translated = translate_with_model(args.text, args.target_lang, args.source_lang)
            else:
                # Use simulation mode
                translated = simulate_translation(args.text, args.target_lang)
            
            print(translated)
        except Exception as e:
            print(f"ERROR: {e}")
            sys.exit(1)
    else:
        parser.print_help()

if __name__ == "__main__":
    main()