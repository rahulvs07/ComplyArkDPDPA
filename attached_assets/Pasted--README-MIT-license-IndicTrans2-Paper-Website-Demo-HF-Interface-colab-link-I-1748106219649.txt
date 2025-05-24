<README
MIT license
IndicTrans2
📜 Paper | 🌐 Website | ▶️ Demo | 🤗 HF Interface | colab link
IndicTrans2 is the first open-source transformer-based multilingual NMT model that supports high-quality translations across all the 22 scheduled Indic languages — including multiple scripts for low-resouce languages like Kashmiri, Manipuri and Sindhi. It adopts script unification wherever feasible to leverage transfer learning by lexical sharing between languages. Overall, the model supports five scripts Perso-Arabic (Kashmiri, Sindhi, Urdu), Ol Chiki (Santali), Meitei (Manipuri), Latin (English), and Devanagari (used for all the remaining languages).
We open-souce all our training dataset (BPCC), back-translation data (BPCC-BT), final IndicTrans2 models, evaluation benchmarks (IN22, which includes IN22-Gen and IN22-Conv) and training and inference scripts for easier use and adoption within the research community. We hope that this will foster even more research in low-resource Indic languages, leading to further improvements in the quality of low-resource translation through contributions from the research community.
This code repository contains instructions for downloading the artifacts associated with IndicTrans2, as well as the code for training/fine-tuning the multilingual NMT models.
Here is the list of languages supported by the IndicTrans2 models:
Assamese (asm_Beng)	Kashmiri (Arabic) (kas_Arab)	Punjabi (pan_Guru)
Bengali (ben_Beng)	Kashmiri (Devanagari) (kas_Deva)	Sanskrit (san_Deva)
Bodo (brx_Deva)	Maithili (mai_Deva)	Santali (sat_Olck)
Dogri (doi_Deva)	Malayalam (mal_Mlym)	Sindhi (Arabic) (snd_Arab)
English (eng_Latn)	Marathi (mar_Deva)	Sindhi (Devanagari) (snd_Deva)
Konkani (gom_Deva)	Manipuri (Bengali) (mni_Beng)	Tamil (tam_Taml)
Gujarati (guj_Gujr)	Manipuri (Meitei) (mni_Mtei)	Telugu (tel_Telu)
Hindi (hin_Deva)	Nepali (npi_Deva)	Urdu (urd_Arab)
Kannada (kan_Knda)	Odia (ory_Orya)
Updates
🚨 Jan 18, 2025 - Long Context Models- RoPE-based variants of IndicTrans2 models capable of handling sequence lengths upto 2048 tokens are available here.
🚨 Dec 20, 2024 - The latest releases of the high-quality human-annotated BPCC-Seed dataset would henceforth be made available on the AI4Bharat Website.
🚨 Dec 30, 2023 - Migrated IndicTrans2 tokenizer for HF compatible IndicTrans2 models to IndicTransToolkit and will be maintained separately there from now onwards. Add LoRA fine-tuning scripts for our IndicTrans2 models in huggingface_interface.
🚨 Dec 1, 2023 - Release of Indic-Indic model and corresponding distilled variants for each base model. Please refer to the Download section for the checkpoints.
🚨 Sep 9, 2023 - Added HF compatible IndicTrans2 models. Please refer to the README for detailed example usage.
Tables of Contents
Download Models and Other Artifacts
Multilingual Translation Models
Training Data
Evaluation Data
Installation
Data
Training
Evaluation
Preparing Data for Training
Using our SPM model and Fairseq dictionary
Training your own SPM models and learning Fairseq dictionary
Training / Fine-tuning
Inference
Fairseq Inference
CT2 Inference
Evaluations
Baseline Evaluation
LICENSE
Citation
Download Models and Other Artifacts
Multilingual Translation Models
Model	En-Indic	Indic-En	Indic-Indic	Evaluations
Base (used for benchmarking)	Fairseq & HF	fairseq & HF	HF	translations (as of May 10, 2023), metrics
Distilled	Fairseq & HF	Fairseq & HF	HF
Training Data
Data	URL
✨ BPCC-Seed Latest Release	HF Config: bpcc-seed-latest
BPCC (Used in Paper - utilizes the BPCC-Seed V1 dataset)	HF Config: bpcc-seed-v1
Back-translation (BPCC-BT)	Will be updated
Full Data Split	Download
Evaluation Data
Data	URL
IN22 test set	download
FLORES-22 Indic dev set	download
Installation
Instructions to setup and install everything before running the code.
Clone the github repository and navigate to the project directory.
git clone https://github.com/AI4Bharat/IndicTrans2
cd IndicTrans2
Install all the dependencies and requirements associated with the project.
source install.sh
Note: We recommend creating a virtual environment with python>=3.7.
Additional notes about Installation
The prepare_data_joint_finetuning.sh and prepare_data_joint_training.sh scripts expect that the sentencepiece commandline utility and GNU parallel are installed.
To install the sentencepiece command line utility, please follow the instructions here.
Please check if GNU parallel is installed, if not please install the same or alternatively in case of installation issues, remove parallel --pipe --keep-order from the respective training / finetuning script as well as apply_sentence_piece.sh.
Data
Training
Bharat Parallel Corpus Collection (BPCC) is a comprehensive and publicly available parallel corpus that includes both existing and new data for all 22 scheduled Indic languages. It is comprised of two parts: BPCC-Mined and BPCC-Human, totaling approximately 230 million bitext pairs. BPCC-Mined contains about 228 million pairs, with nearly 126 million pairs newly added as a part of this work. On the other hand, BPCC-Human consists of 2.2 million gold standard English-Indic pairs, with an additional 644K bitext pairs from English Wikipedia sentences (forming the BPCC-H-Wiki subset) and 139K sentences covering everyday use cases (forming the BPCC-H-Daily subset). It is worth highlighting that BPCC provides the first available datasets for 7 languages and significantly increases the available data for all languages covered.
You can find the contribution from different sources in the following table:
BPCC-Mined	Existing	Samanantar	19.4M
NLLB	85M
Newly Added	Samanantar++	121.6M
Comparable	4.3M
BPCC-Human	Existing	NLLB	18.5K
ILCI	1.3M
Massive	115K
Newly Added	Wiki	644K
Daily	139K
Additionally, we provide augmented back-translation data generated by our intermediate IndicTrans2 models for training purposes. Please refer our paper for more details on the selection of sample proportions and sources.
English BT data (English Original)	401.9M
Indic BT data (Indic Original)	400.9M
Evaluation
IN22 test set is a newly created comprehensive benchmark for evaluating machine translation performance in multi-domain, n-way parallel contexts across 22 Indic languages. It has been created from three distinct subsets, namely IN22-Wiki, IN22-Web and IN22-Conv. The Wikipedia and Web sources subsets offer diverse content spanning news, entertainment, culture, legal, and India-centric topics. IN22-Wiki and IN22-Web have been combined and considered for evaluation purposes and released as IN22-Gen. Meanwhile, IN22-Conv the conversation domain subset is designed to assess translation quality in typical day-to-day conversational-style applications.
IN22-Gen (IN22-Wiki + IN22-Web)	1024 sentences	🤗 ai4bharat/IN22-Gen
IN22-Conv	1503 sentences	🤗 ai4bharat/IN22-Conv
You can download the data artifacts released as a part of this work from the following section.
Preparing Data for Training
BPCC data is organized under different subsets as described above, where each subset contains language pair subdirectories with the sentences pairs. We also provide LaBSE and LASER for the mined subsets of BPCC. In order to replicate our training setup, you will need to combine the data for corresponding language pairs from different subsets and remove overlapping bitext pairs if any.
Here is the expected directory structure of the data:
BPCC
├── eng_Latn-asm_Beng
│   ├── train.eng_Latn
│   └── train.asm_Beng
├── eng_Latn-ben_Beng
└── ...
While we provide deduplicated subsets with the current available benchmarks, we highly recommend performing deduplication using the combined monolingual side of all the benchmarks. You can use the following command for deduplication once you combine the monolingual side of all the benchmarks in the directory.
python3 scripts/dedup_benchmark.py <in_data_dir> <out_data_dir> <benchmark_dir>
<in_data_dir>: path to the directory containing train data for each language pair in the format {src_lang}-{tgt_lang}
<out_data_dir>: path to the directory where the deduplicated train data will be written for each language pair in the format {src_lang}-{tgt_lang}
<benchmark_dir>: path to the directory containing the language-wise monolingual side of dev/test set, with monolingual files named as test.{lang}
Using our SPM model and Fairseq dictionary
Once you complete the deduplication of the training data with the available benchmarks, you can preprocess and binarize the data for training models. Please download our trained SPM model and learned Fairseq dictionary using the following links for your experiments.
En-Indic	Indic-En	Indic-Indic
SPM model	download	download	download
Fairseq dictionary	download	download	download
To prepare the data for training En-Indic model, please do the following:
Download the SPM model in the experiment directory and rename it as vocab.
Download the Fairseq dictionary in the experiment directory and rename it as final_bin.
Here is the expected directory for training En-Indic model:
en-indic-exp
├── train
│   ├── eng_Latn-asm_Beng
│   │   ├── train.eng_Latn
│   │   └── train.asm_Beng
│   ├── eng_Latn-ben_Beng
│   └── ...
├── devtest
│   └── all
│       ├── eng_Latn-asm_Beng
│       │   ├── dev.eng_Latn
│       │   └── dev.asm_Beng
│       ├── eng_Latn-ben_Beng
│       └── ...
├── vocab
│   ├── model.SRC
│   ├── model.TGT
│   ├── vocab.SRC
│   └── vocab.TGT
└── final_bin
├── dict.SRC.txt
└── dict.TGT.txt
To prepare data for training the Indic-En model, you should reverse the language pair directories within the train and devtest directories. Additionally, make sure to download the corresponding SPM model and Fairseq dictionary and put them in the experiment directory, similar to the procedure mentioned above for En-Indic model training.
You can binarize the data for model training using the following:
bash prepare_data_joint_finetuning.sh <exp_dir>
<exp_dir>: path to the directory containing the raw data for binarization
You will need to follow the same steps for data preparation in case of fine-tuning models.
Training your own SPM models and learning Fairseq dictionary
If you want to train your own SPM model and learn Fairseq dictionary, then please do the following:
Collect a balanced amount of English and Indic monolingual data (we use around 3 million sentences per language-script combination). If some languages have limited data available, increase their representation to achieve a fair distribution of tokens across languages.
Perform script unification for Indic languages wherever possible using scripts/preprocess_translate.py and concatenate all Indic data into a single file.
Train two SPM models, one for English and other for Indic side using the following:
spm_train --input=train.indic --model_prefix=<model_name> --vocab_size=<vocab_size> --character_coverage=1.0 --model_type=BPE
Copy the trained SPM models in the experiment directory mentioned earlier and learn the Fairseq dictionary using the following:
bash prepare_data_joint_training.sh <exp_dir>
You will need to use the same Fairseq dictionary for any subsequent fine-tuning experiments and refer to the steps described above (link).
Training / Fine-tuning
After binarizing the data, you can use train.sh to train the models. We provide the default hyperparameters used in this work. You can modify the hyperparameters as per your requirement if needed. If you want to train the model on a customized architecture, then please define the architecture in model_configs/custom_transformer.py. You can start the model training with the following command:
bash train.sh <exp_dir> <model_arch>
<exp_dir>: path to the directory containing the binarized data
<model_arch>: custom transformer architecture used for model training
For fine-tuning, the initial steps remain the same. However, the finetune.sh script includes an additional argument, pretrained_ckpt, which specifies the model checkpoint to be loaded for further fine-tuning. You can perform fine-tuning using the following command:
bash finetune.sh <exp_dir> <model_arch> <pretrained_ckpt>
<exp_dir>: path to the directory containing the binarized data
<model_arch>: custom transformer architecture used for model training
transformer_18_18 - For IT2 Base models
transformer_base18L - For IT2 Distilled models
<pretrained_ckpt>: path to the fairseq model checkpoint to be loaded for further fine-tuning
You can download the model artifacts released as a part of this work from the following section.
The pretrained checkpoints have 3 directories, a fairseq model directory and 2 CT-ported model directories. Please note that the CT2 models are provided only for efficient inference. For fine-tuning purposes you should use the fairseq_model. Post that you can use the fairseq-ct2-converter to port your fine-tuned checkpoints to CT2 for faster inference.
Inference
Fairseq Inference
In order to run inference on our pretrained models using bash interface, please use the following:
bash joint_translate.sh <infname> <outfname> <src_lang> <tgt_lang> <ckpt_dir>
infname: path to the input file containing sentences
outfname: path to the output file where the translations should be stored
src_lang: source language
tgt_lang: target language
ckpt_dir: path to the fairseq model checkpoint directory
If you want to run the inference using python interface then please execute the following block of code from the root directory:
from inference.engine import Model
model = Model(ckpt_dir, model_type="fairseq")
sents = [sent1, sent2,...]
for a batch of sentences
model.batch_translate(sents, src_lang, tgt_lang)
for a paragraph
model.translate_paragraph(text, src_lang, tgt_lang)
CT2 Inference
In order to run inference on CT2-ported model using python inference then please execute the following block of code from the root directory:
from inference.engine import Model
model = Model(ckpt_dir, model_type="ctranslate2")
sents = [sent1, sent2,...]
for a batch of sentences
model.batch_translate(sents, src_lang, tgt_lang)
for a paragraph
model.translate_paragraph(text, src_lang, tgt_lang)
Evaluations
We consider the chrF++ score as our primary metric. Additionally, we also report the BLEU and Comet scores. We also perform statistical significance tests for each metric to ascertain whether the differences are statistically significant.
In order to run our evaluation scripts, you will need to organize the evaluation test sets into the following directory structure:
eval_benchmarks
├── flores
│   └── eng_Latn-asm_Beng
│       ├── test.eng_Latn
│       └── test.asm_Beng
├── in22-gen
├── in22-conv
├── ntrex
└── ...
To compute the BLEU and chrF++ scores for prediction file, you can use the following command:
bash compute_metrics.sh <pred_fname> <ref_fname> <tgt_lang>
pred_fname: path to the model translations
ref_fname: path to the reference translations
tgt_lang: target language
In order to automate the inference over the individual test sets for En-Indic, you can use the following command:
bash eval.sh <devtest_data_dir> <ckpt_dir> <system>
<devtest_data_dir>: path to the evaluation set with language pair subdirectories (for example, flores directory in the above tree structure)
<ckpt_dir>: path to the fairseq model checkpoint directory
<system>: system name suffix to store the predictions in the format test.{lang}.pred.{system}
In case of Indic-En evaluation, please use the following command:
bash eval_rev.sh  <devtest_data_dir> <ckpt_dir> <system>
<devtest_data_dir>: path to the evaluation set with language pair subdirectories (for example, flores directory in the above tree structure)
<ckpt_dir>: path to the fairseq model checkpoint directory
<system>: system name suffix to store the predictions in the format test.{lang}.pred.{system}
Note: You don’t need to reverse the test set directions for each language pair.
In case of Indic-Indic evaluation, please use the following command:
bash pivot_eval.sh <devtest_data_dir> <pivot_lang> <src2pivot_ckpt_dir> <pivot2tgt_ckpt_dir> <system>
<devtest_data_dir>: path to the evaluation set with language pair subdirectories (for example, flores directory in the above tree structure)
<pivot_lang>: pivot language (default should be eng_Latn)
<src2pivot_ckpt_dir>: path to the fairseq Indic-En model checkpoint directory
<pivot2tgt_ckpt_dir>: path to the fairseq En-Indic model checkpoint directory
<system>: system name suffix to store the predictions in the format test.{lang}.pred.{system}
In order to perform significance testing for BLEU and chrF++ metrics after you have the predictions for different systems, you can use the following command:
bash compute_comet_metrics_significance.sh <devtest_data_dir>
<devtest_data_dir>: path to the evaluation set with language pair subdirectories (for example, flores directory in the above tree structure)
Similarly, to compute the COMET scores and perform significance testing on predictions of different systems, you can use the following command.
bash compute_comet_score.sh <devtest_data_dir>
<devtest_data_dir>: path to the evaluation set with language pair subdirectories (for example, flores directory in the above tree structure)
Please note that as we compute significance tests with the same script and automate everything, it is best to have all the predictions for all the systems in place to avoid repeating anything. Also, we define the systems in the script itself, if you want to try out other systems, make sure to edit it there itself.
Baseline Evaluation
To generate the translation results for baseline models such as M2M-100, MBART, Azure, Google, and NLLB MoE, you can check the scripts provided in the "baseline_eval" directory of this repository. For NLLB distilled, you can either modify NLLB_MoE eval or use this repository. Similarly, for IndicTrans inference, please refer to this repository