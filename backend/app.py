from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from model import ImprovedDnCNN
import torch
from PIL import Image
import io
import torchvision.transforms.functional as TF

# --- App setup ---
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

# --- Device (CPU for free hosting) ---
device = torch.device("cpu")


# --- Function to fix DataParallel weights ---
def load_model_weights(model, weight_path, device):
    state_dict = torch.load(weight_path, map_location=device)

    # Remove "module." prefix if model was trained with DataParallel
    new_state_dict = {}
    for k, v in state_dict.items():
        if k.startswith("module."):
            new_state_dict[k[7:]] = v
        else:
            new_state_dict[k] = v

    model.load_state_dict(new_state_dict)
    return model


# --- Load model ---
model = ImprovedDnCNN()
model = load_model_weights(model, "dncnn_color.pth", device)
model.to(device)
model.eval()


# --- Image resize safeguard ---
def resize_if_large(img, max_dim=512):
    if max(img.size) > max_dim:
        img.thumbnail((max_dim, max_dim))
    return img


# --- Endpoint ---
@app.post("/denoise")
async def denoise(file: UploadFile = File(...)):
    try:
        # Read uploaded image
        img_bytes = await file.read()
        img = Image.open(io.BytesIO(img_bytes)).convert("RGB")

        # Resize large images (protects server memory)
        img = resize_if_large(img)

        # Convert to tensor and add batch dimension
        input_tensor = TF.to_tensor(img).unsqueeze(0).to(device)

        # Inference
        with torch.no_grad():
            output_tensor = model(input_tensor).clamp(0, 1)

        # Convert tensor back to image
        output_img = TF.to_pil_image(output_tensor.squeeze(0).cpu())
        buf = io.BytesIO()
        output_img.save(buf, format="PNG")
        buf.seek(0)

        return StreamingResponse(buf, media_type="image/png")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
