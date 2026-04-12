from flask import Flask, render_template, request, jsonify
from predict_model import predict_disease
import traceback

app = Flask(__name__)

@app.route('/')
def home():
    """Serves the main frontend page."""
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    """API Endpoint to predict diseases from symptom text."""
    try:
        data = request.json
        symptoms = data.get('symptoms', '').strip()
        
        if not symptoms:
            return jsonify({'error': 'Please enter some symptoms.'}), 400
            
        # Run prediction
        result = predict_disease(symptoms)
        
        # predict_disease returns None if no symptoms match
        if result is None:
             return jsonify({
                 'error': 'No matching symptoms found in our database. Please try different terms.'
             }), 400
             
        return jsonify({'success': True, 'data': result})
        
    except Exception as e:
        print("Error during prediction:")
        traceback.print_exc()
        return jsonify({'error': 'An internal error occurred. Please try again.'}), 500

if __name__ == '__main__':
    print("=" * 60)
    print(" Starting SehatSetu ML Web Interface")
    print(" Access at: http://localhost:5000")
    print("=" * 60)
    app.run(debug=True, port=5000)
