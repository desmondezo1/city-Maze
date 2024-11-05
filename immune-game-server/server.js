// server.js

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { OpenAI } = require('openai');

dotenv.config();

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());


// Serve static files from the 'images' directory
const imagesDir = path.join(__dirname, 'images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir);
}
app.use('/images', express.static(imagesDir));

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// [theme, e.g., steampunk workshop, haunted mansion, futuristic space station]
// [describe central feature, e.g., a large mechanical clock, a grand staircase, a central control panel]
// [describe wall and floor material, e.g., wooden panels, metal plates, stone tiles]
// [describe lighting type, e.g., gas lamps, neon lights, candlelight]

function getImagePrompt(
    theme="steampunk workshop", 
    part="human heart", 
    feature="a gaint engine that pumps blood",
    wallType="a stone tiles",
    lightType="gas lamps"
){

return `
Create a 2D top-down game scene with the style of a ${theme}, that is themed after a ${part}, 
viewed from above as if seen from the ceiling. The scene should feature ${feature} as the focal point. 

Use ${wallType} and include detailed textures to show signs of wear or uniqueness.

Incorporate ${lightType} that casts shadows and enhances the overall ambiance. 
Decorate the room with thematic elements, e.g., gears and cogs, cobwebs and torn drapes, holographic screens for added character. 
The color palette should consist of the possible color of the organ the room is themed after e.g., muted browns and brass, dark purples and blacks, bright blues and silvers to match the theme.

Add shadowed corners for depth and mystery, and ensure some areas appear worn or aged with details like
e.g., chipped paint, broken tiles, moss growth, scattered debris. 
The overall effect should be immersive, conveying a sense of mystery, adventure, futuristic innovation.
The building should have four entrances top, bottom, left and right

`
}


const prompt = `
Generate a JSON object for a game room in a 2D adventure game where the player represents the immune system fighting pathogens in a specific body part. The JSON should include:

- roomId: Unique identifier for the room.
- theme: the baseline theme of the room for example Futuristic Space Station, haunted house, dark forest, magical library
- opponents: Array of opponents with type, count, movementPattern, and difficulty.
- feature: An imaginary or creative feature that adds to the theme of the room, for example a room themed after a heart should have a complex cog machine that pumps red fluid through transparent pipes
- sceneDescription: Brief description of the scene.
- diseaseExplanation: Educational explanation of the disease or pathogens.
- organ: the name of the part of the human body the room is themed after e.g eyes, heart, mouth
- easterEgg: (Optional) Details about an optional task and reward.
- wallType: the type of walls present in the room, for example, stone walls, muscle wall, metal wall
- lightType: the type of lighting source around the room, that adds to the theme and mystique, for example medivial torch, gas lamp, neon light

Ensure the room is unique and provides a different gameplay challenge. 
Ensure the Json response is pure JSON and does not include 'json' as a start. It must start with "{" and end with "}"
Ensure you generate 3 of the objects in an array, and return the JSON
`






function removeJsonPrefix(response) {
    // Define the regex pattern to match the Markdown JSON code block
    const regex = /^```json\s*\n([\s\S]*?)\n```$/;

    // Attempt to match the pattern
    const match = response.match(regex);

    if (match) {
        // If a match is found, return the captured JSON content
        return match[1];
    }

    // If no match is found, return the original string unchanged
    return response;
}



// Endpoint to generate room JSON
app.get('/generate-room', async (req, res) => {
    try {
      // Ensure 'prompt' is defined or obtained from the request
  
      const completion = await openai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content:
              'You are a helpful game developer that has the ability to create detailed descriptions.',
          },
          { role: 'user', content: prompt },
        ],
        model: 'gpt-4o', // Corrected model name
        max_tokens: 1000,
        stop: ['\n\n'],
      });
  
      console.log({ res: completion.choices[0].message.content });
  
      // Assuming removeJsonPrefix is a custom function defined elsewhere
      const finalResp = JSON.parse(
        removeJsonPrefix(completion.choices[0].message.content)
      );



      for (let index = 0; index < finalResp.length; index++) {
        const element = finalResp[index];

        const imgPt = getImagePrompt(element.theme,element.organ,element.feature,element.wallType, element.lightType)
  
        const image = await openai.images.generate({
            model: 'dall-e-3',
            prompt: imgPt,
            size: '1792x1024',
            response_format: 'b64_json', // Ensure we get base64 data
        });
    
        // Decode base64 image
        const imageBase64 = image.data[0].b64_json;
        const imageBuffer = Buffer.from(imageBase64, 'base64');
    
        // Generate a unique filename
        const imageName = `${element.roomId}.png`; // You can change the extension based on your needs
        const imagePath = path.join(imagesDir, imageName);
    
        // Save the image to the 'images' directory
        await fs.promises.writeFile(imagePath, imageBuffer);
    
        // Generate the local URL to the saved image
        const localUrl = `${req.protocol}://${req.get('host')}/images/${imageName}`;
    
        // Add the local URL to the response
        finalResp[index].backgroundImageUrl = localUrl;
     }

      res.json(finalResp);
    } catch (error) {
      console.error({ error });
      res.status(500).send('Error generating room JSON');
    }
  });
  









// Endpoint to generate image description (for image generation)
app.post('/generate-image-description', async (req, res) => {
  const { roomId } = req.body;
  const prompt = `Provide a detailed description for an image representing the ${roomId} in a 2D adventure game where the player represents the immune system fighting pathogens. The description should be vivid and suitable for generating an image using an AI image generation tool.`;

  try {
    const response = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: prompt,
      max_tokens: 150,
      temperature: 0.7,
      stop: ["\n\n"],
    });

    const text = response.data.choices[0].text.trim();
    res.json({ description: text });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error generating image description");
  }
});


app.get('/image', async (req,res) => {
    try {


  const image = await openai.images.generate({ model: "dall-e-3", prompt: "A cute baby sea otter" });

    console.log(image.data);

    res.json(image.data);

    } catch (error) {
        console.log({error})
    }
    
})
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});


