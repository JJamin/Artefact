import sys

#   [ Command Line Usage ]
#   $> python3 convert.py <model name>

NAME = sys.argv[1]
print( 'opening ./raw/{}.ply'.format(NAME) )

# Initialize
infile = open('./raw/{}.ply'.format(NAME), 'r')
outfile = open('./{}.json'.format(NAME), 'w')
line = infile.readline()
vertexCount = 0
indexCount = 0
i = 1
indicies = []
verticies = []

def RS(n):
    return round(float(n)*100)/100
def RL(n):
    return round(float(n)*100)/100

print("Loading file...")
# Gather parameters
while line:
    args = line.strip().split(' ')
    if args[0] == 'element':
        if args[1] == 'vertex': vertexCount = int( args[2] )
        if args[1] == 'face': indexCount = int( args[2] )
    if args[0] == 'end_header':
        line = infile.readline()
        break

    line = infile.readline()
    i += 1

# Read verticies
print("Writing verticies...")
outfile.write('{"verts":[')
i = 0
for _ in range(vertexCount):
    args = line.strip().split(' ')
    # verticies.append
    outfile.write("{},{},{},{},{},{}{}".format( RS(args[0]),RS(args[1]),RS(args[2]), RL(float(args[3])/255),RL(float(args[4])/255),RL(float(args[5])/255), '' if i==vertexCount-1 else ',' ))
    line = infile.readline()
    i += 1

# Read faces
print("Writing faces...")
outfile.write('],"faces":[')
i = 0
for _ in range(indexCount):
    args = line.strip().split(' ')
    # indicies.append
    outfile.write("{},{},{}{}".format( args[1],args[2],args[3], '' if i==indexCount-1 else ',' ))
    line = infile.readline()
    i += 1

outfile.write("]}")

print("Saved to {}.json. Faces: {}".format(NAME,indexCount))
infile.close()


