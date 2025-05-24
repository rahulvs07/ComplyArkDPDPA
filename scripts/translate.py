#!/usr/bin/env python3
"""
IndicTrans2 Translation Script

This script provides a command-line interface and API for translating text
using the IndicTrans2 model. It supports all 22 scheduled Indian languages.

Usage:
  python translate.py --text "Text to translate" --target_lang "hin_Deva" --source_lang "eng_Latn"
  python translate.py --file input.txt --target_lang "hin_Deva" --source_lang "eng_Latn" --output output.txt
"""

import os
import sys
import argparse
import json
from typing import List, Dict, Union, Optional

# Set environment variables to control GPU memory usage
os.environ["CUDA_VISIBLE_DEVICES"] = "0"  # Use only the first GPU if available
os.environ["TF_FORCE_GPU_ALLOW_GROWTH"] = "true"  # Grow GPU memory usage as needed

def setup_model_path():
    """Set up the path to the model directory."""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    models_dir = os.path.join(os.path.dirname(script_dir), "models", "translation")
    return models_dir

def load_model(model_type: str):
    """
    Load the IndicTrans2 model.
    
    Args:
        model_type: Type of model to load ('en-indic', 'indic-en', or 'indic-indic')
    
    Returns:
        Loaded model instance
    """
    try:
        # This import is placed here so the script can run without these dependencies
        # for help and other non-translation functions
        from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
        import torch
        
        models_dir = setup_model_path()
        model_path = os.path.join(models_dir, model_type)
        
        print(f"Loading model from {model_path}...")
        
        # Check if the model directory exists
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model directory not found: {model_path}")
        
        # Load the model and tokenizer from the specified path
        tokenizer = AutoTokenizer.from_pretrained(model_path)
        model = AutoModelForSeq2SeqLM.from_pretrained(model_path)
        
        # Move model to GPU if available
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        model = model.to(device)
        
        return {
            "model": model,
            "tokenizer": tokenizer,
            "device": device
        }
    
    except ImportError as e:
        print(f"Error: Required packages not installed. {e}")
        print("Please install the required packages: pip install torch transformers")
        sys.exit(1)
    except Exception as e:
        print(f"Error loading model: {e}")
        sys.exit(1)

def get_model_type(source_lang: str, target_lang: str) -> str:
    """
    Determine which model to use based on source and target languages.
    
    Args:
        source_lang: Source language code (e.g., 'eng_Latn', 'hin_Deva')
        target_lang: Target language code (e.g., 'eng_Latn', 'hin_Deva')
    
    Returns:
        Model type to use ('en-indic', 'indic-en', or 'indic-indic')
    """
    if source_lang == "eng_Latn" and target_lang != "eng_Latn":
        return "en-indic"
    elif source_lang != "eng_Latn" and target_lang == "eng_Latn":
        return "indic-en"
    else:
        return "indic-indic"

def translate_text(text: str, target_lang: str, source_lang: str = "eng_Latn", model_dict: Optional[Dict] = None) -> str:
    """
    Translate text using the IndicTrans2 model.
    
    Args:
        text: Text to translate
        target_lang: Target language code (e.g., 'hin_Deva')
        source_lang: Source language code (e.g., 'eng_Latn')
        model_dict: Optional pre-loaded model dictionary
    
    Returns:
        Translated text
    """
    try:
        import torch
        
        # Determine which model to use
        model_type = get_model_type(source_lang, target_lang)
        
        # Load model if not provided
        if model_dict is None:
            model_dict = load_model(model_type)
        
        model = model_dict["model"]
        tokenizer = model_dict["tokenizer"]
        device = model_dict["device"]
        
        # Prepare the input for the model
        if model_type in ["en-indic", "indic-indic"]:
            # Add target language tag
            text = f">>{target_lang}<< {text}"
        
        # Tokenize the input
        inputs = tokenizer(text, return_tensors="pt").to(device)
        
        # Generate translation
        with torch.no_grad():
            translated = model.generate(**inputs, max_length=512)
        
        # Decode the generated tokens
        translated_text = tokenizer.decode(translated[0], skip_special_tokens=True)
        
        return translated_text
    
    except Exception as e:
        print(f"Error translating text: {e}")
        return f"ERROR: {str(e)}"

def translate_batch(texts: List[str], target_lang: str, source_lang: str = "eng_Latn") -> List[str]:
    """
    Translate a batch of texts.
    
    Args:
        texts: List of texts to translate
        target_lang: Target language code
        source_lang: Source language code
    
    Returns:
        List of translated texts
    """
    # Load model once for the entire batch
    model_type = get_model_type(source_lang, target_lang)
    model_dict = load_model(model_type)
    
    results = []
    for text in texts:
        translated = translate_text(text, target_lang, source_lang, model_dict)
        results.append(translated)
    
    return results

def translate_file(input_file: str, output_file: str, target_lang: str, source_lang: str = "eng_Latn"):
    """
    Translate the contents of a file.
    
    Args:
        input_file: Path to the input file
        output_file: Path to the output file
        target_lang: Target language code
        source_lang: Source language code
    """
    try:
        # Read input file
        with open(input_file, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        # Strip newlines and filter out empty lines
        texts = [line.strip() for line in lines if line.strip()]
        
        # Translate all texts
        translated_texts = translate_batch(texts, target_lang, source_lang)
        
        # Write to output file
        with open(output_file, 'w', encoding='utf-8') as f:
            for translated in translated_texts:
                f.write(translated + '\n')
        
        print(f"Translation completed. Output written to {output_file}")
    
    except Exception as e:
        print(f"Error translating file: {e}")
        sys.exit(1)

def get_supported_languages():
    """
    Return a list of supported languages.
    """
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

def download_models():
    """
    Download the IndicTrans2 models.
    """
    try:
        import requests
        import tqdm
        import zipfile
        
        models_dir = setup_model_path()
        os.makedirs(models_dir, exist_ok=True)
        
        # URLs for the models (these are placeholder URLs and should be replaced with actual URLs)
        model_urls = {
            "en-indic": "https://storage.googleapis.com/indicnlp-public-models/indictrans2/en-indic.zip",
            "indic-en": "https://storage.googleapis.com/indicnlp-public-models/indictrans2/indic-en.zip",
            "indic-indic": "https://storage.googleapis.com/indicnlp-public-models/indictrans2/indic-indic.zip"
        }
        
        for model_name, url in model_urls.items():
            model_path = os.path.join(models_dir, model_name)
            
            # Skip if model already exists
            if os.path.exists(model_path):
                print(f"Model '{model_name}' already exists at {model_path}")
                continue
            
            print(f"Downloading {model_name} model...")
            
            # Download the model
            zip_path = os.path.join(models_dir, f"{model_name}.zip")
            response = requests.get(url, stream=True)
            
            # Get the total file size
            total_size = int(response.headers.get('content-length', 0))
            block_size = 1024  # 1 Kibibyte
            
            # Create a progress bar
            t = tqdm.tqdm(total=total_size, unit='iB', unit_scale=True)
            
            with open(zip_path, 'wb') as f:
                for data in response.iter_content(block_size):
                    t.update(len(data))
                    f.write(data)
            t.close()
            
            # Extract the zip file
            print(f"Extracting {model_name} model...")
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(models_dir)
            
            # Remove the zip file
            os.remove(zip_path)
            
            print(f"Model '{model_name}' downloaded and extracted to {model_path}")
        
        print("All models downloaded successfully!")
    
    except ImportError:
        print("Error: Required packages not installed.")
        print("Please install the required packages: pip install requests tqdm")
        sys.exit(1)
    except Exception as e:
        print(f"Error downloading models: {e}")
        sys.exit(1)

def check_model_availability():
    """
    Check if the models are available.
    """
    models_dir = setup_model_path()
    
    # Check if models directory exists
    if not os.path.exists(models_dir):
        return {
            "available": False,
            "models": {},
            "models_dir": models_dir
        }
    
    # Check if model files exist
    models = {
        "en-indic": os.path.exists(os.path.join(models_dir, "en-indic")),
        "indic-en": os.path.exists(os.path.join(models_dir, "indic-en")),
        "indic-indic": os.path.exists(os.path.join(models_dir, "indic-indic"))
    }
    
    # Determine overall availability
    available = any(models.values())
    
    return {
        "available": available,
        "models": models,
        "models_dir": models_dir
    }

def main():
    """Main function to handle command-line arguments."""
    parser = argparse.ArgumentParser(description="Translate text using IndicTrans2 model")
    
    # Create a mutually exclusive group for text input methods
    input_group = parser.add_mutually_exclusive_group(required=False)
    input_group.add_argument("--text", type=str, help="Text to translate")
    input_group.add_argument("--file", type=str, help="Input file path")
    
    parser.add_argument("--target_lang", type=str, help="Target language code (e.g., 'hin_Deva')")
    parser.add_argument("--source_lang", type=str, default="eng_Latn", help="Source language code (default: 'eng_Latn')")
    parser.add_argument("--output", type=str, help="Output file path (for file translation)")
    
    # Add commands for model management
    parser.add_argument("--download", action="store_true", help="Download the models")
    parser.add_argument("--check", action="store_true", help="Check if models are available")
    parser.add_argument("--list_languages", action="store_true", help="List supported languages")
    
    args = parser.parse_args()
    
    # Handle utility commands
    if args.list_languages:
        languages = get_supported_languages()
        print(json.dumps(languages, indent=2))
        return
    
    if args.check:
        availability = check_model_availability()
        print(json.dumps(availability, indent=2))
        return
    
    if args.download:
        download_models()
        return
    
    # Handle translation commands
    if args.text:
        if not args.target_lang:
            print("Error: --target_lang is required when translating text")
            parser.print_help()
            sys.exit(1)
        
        translated = translate_text(args.text, args.target_lang, args.source_lang)
        print(translated)
    
    elif args.file:
        if not args.target_lang or not args.output:
            print("Error: --target_lang and --output are required when translating a file")
            parser.print_help()
            sys.exit(1)
        
        translate_file(args.file, args.output, args.target_lang, args.source_lang)
    
    else:
        parser.print_help()

if __name__ == "__main__":
    main()