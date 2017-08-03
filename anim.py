import bpy
import mathutils
import math
from math import radians
from mathutils import Matrix

# When DEBUG = True, this sets up a change-frame callback
# that modifies the scene to be the current state of the animation,
# deleting every object that doesn't have the 'pres' attribute set.

# When DEBUG = False, it actually renders the animation to a bunch of frames.
# I seem to be unable to use blender's own animation rendering pipeline since
# it doesn't have the context around for me to create primitive objects in??

DEBUG = False

SF = 5 # scale factor; ratio of how wide torus is to how thick it is
MAXF = 24 # number of frames of animation
C = bpy.context
D = bpy.data
scene = C.scene
scene.frame_end = MAXF

# Uniform vector
def uni(x):
    return ((x, x, x))

# Make a circle bezier curve with a name
def circ(name, **kwargs):
    bpy.ops.curve.primitive_bezier_circle_add(**kwargs)
    C.active_object.name = name

# kinda surprised this is so hard. I would expect a 'make this bezier
# not cyclic but make sure it has the same shape' operation to exist
# as a UI-exposed option, but I haven't found it
def decycle(sp):
  save_left = sp.bezier_points[0].handle_left.copy()
  save_right = sp.bezier_points[0].handle_right.copy()
  sp.use_cyclic_u = False

  sp.bezier_points.add()
  sp.bezier_points[len(sp.bezier_points)-1].co = sp.bezier_points[0].co.copy()
  sp.bezier_points[len(sp.bezier_points)-1].handle_left = save_left
  sp.bezier_points[len(sp.bezier_points)-1].handle_right = save_right
  sp.bezier_points[0].handle_left_type = 'FREE'
  sp.bezier_points[0].handle_right_type = 'FREE'
  sp.bezier_points[0].handle_left = save_left
  sp.bezier_points[0].handle_right = save_right

def build_scene(scene, time, etime):
  # time ∈ [0, 1]

  # Delete everything. Not 100% sure I'm deleting enough everything to
  # avoid leaks, but I'm doing my best to cover the stuff I know about.
  for ob in scene.objects:
    ob.select = True
    if 'pres' in ob:
      ob.select = False
  bpy.ops.object.delete()
  for block in D.curves:
    if block.users == 0:
      D.curves.remove(block)
  for block in D.cameras:
    if block.users == 0:
      D.cameras.remove(block)
  for block in D.meshes:
    if block.users == 0:
      D.meshes.remove(block)

  # Set cursor to origin
  scene.cursor_location = uni(0)

  # parent
  bpy.ops.object.empty_add(type='PLAIN_AXES')
  C.scene.objects.active.name = 'Parent'

  # Ring
  bpy.ops.curve.primitive_bezier_circle_add(radius=1 - 1./(SF-1), location=uni(0))
  C.scene.objects.active.name = 'c1'
  bpy.ops.curve.primitive_bezier_circle_add(radius=1 + 1./(SF-1), location=uni(0))
  C.scene.objects.active.name = 'c2'
  bpy.data.objects['c1'].rotation_euler = mathutils.Euler((radians(180),0,0), 'XYZ')
  D.objects['c1'].select = True
  D.objects['c2'].select = True
  bpy.ops.object.join()
  C.scene.objects.active.name = 'Ring'

  # Outer
  circ('Outer', radius=SF)
  D.objects['Outer'].data.bevel_object = D.objects['Ring']
  decycle(D.objects['Outer'].data.splines[0])

  D.objects['Outer'].data.bevel_factor_end = etime
  D.objects['Outer'].data.bevel_factor_start = 0
  D.objects['Outer'].data.use_fill_caps = True

  # end caps
  bpy.ops.mesh.primitive_torus_add(major_radius=1, minor_radius=1./(SF-1), location=((-SF, 0, 0)),
                                   rotation=mathutils.Euler((radians(90), 0, 0), 'XYZ'))
  C.scene.objects.active.name = 'Cap1'
  for p in bpy.data.objects['Cap1'].data.polygons:
    p.use_smooth = True

  bpy.ops.mesh.primitive_torus_add(major_radius=1, minor_radius=1./(SF-1), location=((-SF, 0, 0)),
                                   rotation=mathutils.Euler((radians(90), 0, 0), 'XYZ'))
  C.scene.objects.active.name = 'Cap2'
  for p in bpy.data.objects['Cap2'].data.polygons:
    p.use_smooth = True

  obj = bpy.data.objects['Cap2']
  mat = Matrix.Rotation(-etime * radians(360), 4, 'Z')
  obj.matrix_world = mat * obj.matrix_world

  # Parenting
  D.objects['Outer'].parent = D.objects['Parent']
  D.objects['Cap1'].parent = D.objects['Parent']
  D.objects['Cap2'].parent = D.objects['Parent']

  # Materials
  bpy.data.objects['Outer'].active_material = bpy.data.materials['Red']
  bpy.data.objects['Cap1'].active_material = bpy.data.materials['Red']
  bpy.data.objects['Cap2'].active_material = bpy.data.materials['Red']

  obj = bpy.data.objects['Parent']
  mat = Matrix.Translation(((1. - etime) * SF, 0, 0))
  obj.matrix_world = mat * obj.matrix_world

  mat = Matrix.Rotation(-etime * radians(90), 4, 'X')
  obj.matrix_world = mat * obj.matrix_world

  mat = Matrix.Scale(math.pow(1. / SF, time), 4)
  obj.matrix_world = mat * obj.matrix_world

  # for area in bpy.context.screen.areas:
  #   if area.type == 'VIEW_3D':
  #       override = bpy.context.copy()
  #       override['area'] = area
  #       bpy.ops.view3d.viewnumpad(override, type = 'CAMERA')
  #       break

  # scene.camera = D.objects['Camera']
  # for area in bpy.context.screen.areas:
  #   if area.type == 'VIEW_3D':
  #       area.spaces[0].region_3d.view_perspective = 'CAMERA'
def ease(x):
  return 6*x*x*x*x*x - 15*x*x*x*x + 10*x*x*x
def handler(scene):
  t = (scene.frame_current  - 1) / MAXF
  build_scene(scene, t, ease(t))

bpy.app.handlers.frame_change_pre.clear()



if DEBUG:
  bpy.app.handlers.frame_change_pre.append(handler)
else:
  bpy.context.scene.render.filepath = '/tmp/frames/'
  for n in range(MAXF):
    scene.frame_start = n
    scene.frame_end = n
    t = n * 1.0 / MAXF
    build_scene(scene, t, ease(t))
    bpy.context.scene.render.resolution_x = 1024
    bpy.context.scene.render.resolution_y = 768
    C.scene.render.image_settings.file_format = 'PNG'
    C.scene.cycles.samples = 128
    bpy.ops.render.render(animation=True)
