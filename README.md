# 3D World Environment

Originally completed for school: Mar 2022

## Learning objectives

- [x] Add ground plane and skybox image
- [x] Implement lighting sources learned from WebGL: ambient, diffuse, spectral
    - [x] Create HUD to allow user to alter light source intensity, direction, 
- [x] Custom created objects via shapes
    - [x] Add textures
    - [x] Add material
    - [x] Render a scene to target as a texture
- [x] Camera
    - [x] Mouse/keyboard controls 
- [x] Real time shadows based on light positioning
- [x] Fog
- [x] Importing other 3D models (obj files)

## Controls in the environment

### Lighting HUD

In the drop down menu, there is an assortment of different options for the user to control. The spotlight is constantly moving back and forth to display the movement of shadows. 

General controls:
- Intensity of each light can be magnified or reduced
- Color can be chosen via the color picker
- Starting [x, y, z] position of the light can be moved
- Target [x, y, z] position of the light can be moved (where the light is aiming)
- Angle of the light can be changed (if applicable)

### Camera control

The environment can be viewed from any direction via the mouse. 
- Click and drag to move the camera
- Scroll up to zoom in
- Scroll down to zoom out

There is currently no keyboard input since the environment is small

## How to view

**Warning** The model `fruit-tree.obj` is a fairly big file (25.4MB) to render while hosting the environment. 
The page may performance dips while the object loads depending on hardware but will eventually load in.
The world will also increase RAM usage.

Download the repository and ensure that all files are present.

Host `asg5.html` as if it were a standard HTML file called index.html and the world will load in.


