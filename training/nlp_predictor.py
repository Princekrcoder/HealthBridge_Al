import os
import json
import torch

BERT_AVAILABLE = False

try:
    from transformers import AutoTokenizer, AutoModelForSequenceClassification
    
    MODEL_PATH = "models/bert_healthbridge/final"
    tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
    model = AutoModelForSequenceClassification.from_pretrained(MODEL_PATH)
    model.eval()
    
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model = model.to(device)
    
    # Load label mapping safely
    try:
        with open("label_encodings.json", encoding="utf-8") as f:
            label_data = json.load(f)
    except:
        label_data = {}
    
    if hasattr(model, 'config') and model.config.id2label:
        id2label = {int(k): v for k, v in model.config.id2label.items()}
    elif "id2label" in label_data:
        id2label = {int(k): v for k, v in label_data["id2label"].items()}
    elif "diseases" in label_data:
        id2label = {i: v for i, v in enumerate(label_data["diseases"])}
    else:
        id2label = {int(v): k for k, v in label_data.items()}
    
    print(f"[OK] BERT Model loaded | Device: {device} | Classes: {len(id2label)}")
    BERT_AVAILABLE = True

except Exception as e:
    print(f"[ERROR] BERT load failed: {e}")
    print("Keyword-only mode active")


def get_disease_symptoms(disease_name: str) -> dict:
    try:
        with open("data/disease_profiles.json", encoding="utf-8") as f:
            profiles = json.load(f)
            
        for profile in profiles:
            if profile["disease"].lower() == disease_name.lower():
                return dict(zip(profile["symptoms"], profile["weights"]))
    except Exception as e:
        pass
    return {}


def predict_disease(text: str) -> dict:
    if not BERT_AVAILABLE:
        return {"top_disease": None, "confidence": 0.0, "top_5": []}
        
    inputs = tokenizer(text, return_tensors="pt", max_length=128, truncation=True, padding=True).to(device)
    
    with torch.no_grad():
        outputs = model(**inputs)
        
    probs = torch.nn.functional.softmax(outputs.logits, dim=-1)[0]
    
    # Get top 5 predictions
    top_5_probs, top_5_indices = torch.topk(probs, 5)
    
    top_5 = []
    for i in range(5):
        top_5.append({
            "disease": id2label[top_5_indices[i].item()],
            "confidence": round(top_5_probs[i].item(), 4)
        })
        
    return {
        "top_disease": top_5[0]["disease"],
        "confidence": top_5[0]["confidence"],
        "top_5": top_5
    }


def predict_and_extract(text: str) -> dict:
    from nlp_extractor import extract_symptoms
    keyword_symptoms = extract_symptoms(text)
    
    if not BERT_AVAILABLE:
        return {
            "method": "keyword",
            "bert_disease": None,
            "bert_confidence": 0.0,
            "detected_symptoms": keyword_symptoms,
            "source": "keyword_fallback"
        }
        
    bert_result = predict_disease(text)
    
    if bert_result["confidence"] >= 0.70:
        method = "bert"
        top_disease = bert_result["top_disease"]
        detected_symptoms = get_disease_symptoms(top_disease)
        source = "bert_profile"
        
    elif bert_result["confidence"] >= 0.40:
        method = "hybrid"
        detected_symptoms = keyword_symptoms
        source = "hybrid"
        
    else:
        method = "keyword"
        detected_symptoms = keyword_symptoms
        source = "keyword_fallback"
        
    return {
        "method": method,
        "bert_disease": bert_result.get("top_disease"),
        "bert_confidence": bert_result.get("confidence", 0.0),
        "detected_symptoms": detected_symptoms,
        "top_5": bert_result.get("top_5", []),
        "source": source
    }


if __name__ == "__main__":
    tests = [
        "2 din se bahut tez bukhar hai aur sar dard",
        "pet mein dard, loose motion, ulti",
        "skin pe khujli aur laal daane nikle hain",
        "sans lene mein takleef, chest mein dard",
        "aankhon ka rang peela ho gaya, bhook nahi lagti"
    ]
    
    print("\n")
    for t in tests:
        res = predict_and_extract(t)
        print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        print(f"Input   : \"{t}\"")
        print(f"Method  : {res['method']}")
        
        if res.get('bert_disease'):
            print(f"Disease : {res['bert_disease']} ({res['bert_confidence']*100:.1f}%)")
            top_3 = " | ".join([f"{x['disease']} {x['confidence']*100:.0f}%" for x in res['top_5'][:3]])
            print(f"Top 3   : {top_3}")
            
        syms_str = ", ".join([f"{k}({v})" for k, v in res['detected_symptoms'].items()])
        print(f"Symptoms: {syms_str}")
        print("\n")
