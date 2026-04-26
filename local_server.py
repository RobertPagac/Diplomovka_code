from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
from diffusers import FluxPipeline
import base64
from io import BytesIO

app = Flask(__name__)
CORS(app)

print("Načítavam model FLUX (toto môže trvať 1-2 minúty)...")

try:
    pipe = FluxPipeline.from_pretrained(
        "black-forest-labs/FLUX.1-schnell",
        torch_dtype=torch.bfloat16,
        device_map="auto" if torch.cuda.is_available() else None,
        # SEM VLOŽTE VÁŠ TOKEN (hf_...)
        token="hf_VÁŠ_TOKEN_TU"
    )

    if torch.cuda.is_available():
        pipe.enable_model_cpu_offload()
        print("Model načítaný s využitím GPU (offload mode).")
    else:
        pipe.to("cpu")
        print("Model načítaný na CPU (bude to pomalšie).")

except Exception as e:
    print(f"Chyba pri načítaní: {e}")


@app.route('/generate', methods=['POST'])
def generate():
    data = request.json
    prompt = data.get('prompt', '')

    print(f"Generujem textúru pre zadanie: {prompt}")

    try:
        image = pipe(
            prompt,
            guidance_scale=0.0,
            num_inference_steps=4,
            max_sequence_length=256,
        ).images[0]

        buffered = BytesIO()
        image.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode()

        return jsonify({"image": img_str})
    except Exception as e:
        print(f"Chyba pri generovaní: {e}")
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)