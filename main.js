const Origin = require("origin")

//profiler.enable()
module.exports.loop = function() {
    console.log(Object.keys(Game.creeps).length + Memory.rooms.sim.origin.initialSpawns)
    // console.log("<h1 style='text-align: center; color: red;'>Your attention please</h1>")
    // console.log("<h2 style='text-align: center;'>Origin has not been initiated</h2>")
    // console.log("<h2 style='text-align: center;'>To initiate Origin, please issue the following command</h2>")
    // console.log("<h2 style='text-align: center; color: cyan;'>require(\"origin\").initiate()")
    Origin.update()
}
