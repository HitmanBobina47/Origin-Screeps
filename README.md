# Origin-Screeps

Origin is an AI for the game Screeps.

The entire AI is controlled by Origin, which sends commands to each Room, which sends commands to spawners and creeps.  
(It's a little bit more complicated)

Oh yeah, did I mention that Origin is only one file, with a single function call in main?

## How to Use  
1. Move origin.js into your code.  
2. Move main.js into your code.
3. Observe message in console.
4. Run ```require("origin").initiate()``` in the console.
5. Profit!

## Compatibility  
Memory related to origin is kept in 2 places:
  1. Core Origin memory (not used much yet) is stored in Memory.Origin
  2. Origin-Related Memory on objects (creeps, structures, rooms, etc.) is stored in object.memory.origin

Basically what this means is that if later you decide to use something else, anything that Origin put into memory won't get in your way.

However, do not expect that everything will work perfectly if you have already been using something else and decide to plop in Origin.
