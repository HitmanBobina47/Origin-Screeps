module.exports = {
    assemble: function() {
        global.Origin = {}
        global.Origin.ProfileNow = function(ticks) {
            // Game.profiler.reset()
            // console.log("MANUAL PROFILING FOR " + ticks)
            // Memory.Origin.Profiler.Scans.Manual = ticks
            return "Origin Profiler is not ready to be used" + "\n" + "For profiling, please use the functions bundled with the profiler"
            console.log("Origin Profiler is not ready to be used")
            console.log("For profiling, please use the functions bundled with the profiler")
        }
        // global.Origin = class Origin {
        //     constructor(jsons) {
        //         var obj = JSON.parse(json)
        //         this.jobs = obj.jobs
        //     }
        //     addJob(job, priority) {
        //         this.jobs.push({job: job, priority: priority})
        //         var jobstmp = this.jobs.sort((a,b) => a.priority - b.priority)
        //         this.jobs = jobstmp
        //     }
        // }
        global.Origin.tickOrigin = function() {
            var rooms = Memory.Origin.Rooms
            for (var rn in rooms) {
                if (rooms.hasOwnProperty(rn)) {
                    var room = Game.rooms[rooms[rn]]
                    // console.log(rn)
                    room.tickOrigin()
                }
            }
        }
        // global.Origin.Job = class Job {
        //     constructor(bodyNeeded, steps, variables) {
        //         this.bodyNeeded = bodyNeeded;
        //         this.steps = steps;
        //         this.variables = variables;
        //     }
        // }
    //     = class Step {
    //        constructor(funcName, argsDefault) {
    //            this.funcName = funcName;
    //            this.argsDefault = argsDefault;
    //        }
    //    }
        // global.Origin.Job.moveLeft = new global.Origin.Job([MOVE], [new global.Origin.Step("move", ["#7"])], {})
        // global.Origin.Job.feedSpawn = new global.Origin.Job([WORK, CARRY, MOVE], [new global.Origin.Step("room.sourceRequest", []), new global.Origin.Step("moveTo", ["%memory.origin.job.steprets.1"])], {})
        // global.Origin.Util = {}
        // global.Origin.Util.rGet = function(obj, prop) {
        //     if(typeof obj == undefined) {
        //         return false;
        //     }
        //
        //     var _index = prop.indexOf('.')
        //     if(_index > -1) {
        //         return global.Origin.Util.rGet(obj[prop.substring(0, _index)], prop.substr(_index + 1));
        //     }
        //
        //     return obj[prop]
        // }
        Room.prototype.initOrigin = function() {
            this.memory.origin = {
                ticks: 0,
                jobs: [],
                spawn: null,
                sources: [],
                csites: [],
                obit: [],
                initialSpawns: 0
            }
            this.memory.origin.spawn = this.find(FIND_MY_SPAWNS)[0].id;
            var sources = this.find(FIND_SOURCES)
            for (var i = 0; i < sources.length; i++) {
                var p = sources[i].pos
                var m = 0
                for(var x = p.x-1; x <= p.x+1; x++) {
                    for(var y = p.y-1; y <= p.y+1; y++) {
                        if(Game.map.getTerrainAt(x, y, this.name) != "wall") {
                            m++
                        }
                    }
                }
                this.memory.origin.initialSpawns += m
                this.memory.origin.sources[i] = {
                    id: sources[i].id,
                    creepsAssigned: 0,
                    maxCreeps: m
                }
            }
            this.generateOptimalRoads()
            console.log("Creating " + this.memory.origin.initialSpawns + " Initial Creeps")
        }
        Room.prototype.bestCreep = function() {
            var e = this.energyCapacityAvailable / 250;
            var b = []
            for (var i = 1; i < Math.min(e, 4); i++) {
                b.push(WORK)
                b.push(CARRY)
                b.push(MOVE)
                b.push(MOVE)
            }
            return b;
        }
        Room.prototype.tickOrigin = function() {
            this.memory.origin.ticks++
            if(this.memory.origin.initialSpawns > 0) {
                var s = Game.getObjectById(this.memory.origin.spawn)
                if(s.canCreateCreep(this.bestCreep()) == 0) {
                    // console.log("CREATING")
                    s.createCreep(this.bestCreep(), null)
                    this.memory.origin.initialSpawns--;
                }
            }
            if(this.memory.origin.plannedRoads.length > 0) {
                if(this.find(FIND_CONSTRUCTION_SITES).length == 0) {
                    this.createRoadCS()
                }
            }
            if(this.memory.origin.obit.length > 0) {
                var s = Game.getObjectById(this.memory.origin.spawn)
                if(s.canCreateCreep(this.bestCreep()) == 0) {
                    // console.log("CREATING")
                    s.createCreep(this.bestCreep(), this.memory.origin.obit.shift())
                }
            }
            if(Game.time % 10 == 0) {
                var csites = this.find(FIND_CONSTRUCTION_SITES)
                this.memory.origin.csites = []
                for (var i = 0; i < csites.length; i++) {
                    this.memory.origin.csites[i] = csites[i].id
                }
                // console.log(JSON.stringify(this.memory.origin.csites))
            }
            var creeps = this.find(FIND_MY_CREEPS)
            for(var cn in creeps) {
                // console.log(cn)
                var creep = creeps[cn]
                if(creep.memory.origin == undefined) {
                    creep.initOrigin()
                } else {
                    creep.tickOrigin()
                }
            }
        }
        Room.prototype.sourceRequest = function() {
            for (var i = 0; i < this.memory.origin.sources.length; i++) {
                var source = this.memory.origin.sources[i]
                if(source.creepsAssigned < source.maxCreeps) {
                    source.creepsAssigned++
                    return source.id
                }
            }
        }
        Room.prototype.sourceRelease = function(sourceid) {
            this.memory.origin.sources[this.memory.origin.sources.findIndex((e,i,a) => e.id == sourceid)].creepsAssigned--
        }
        Room.prototype.createConstructionSites = function(x, y, wr, hr, type) {
            for(var xi = x - wr; xi <= x + wr; xi++) {
                for(var yi = y - hr; yi <= y + hr; yi++) {
                    this.createConstructionSite(xi, yi, type)
                }
            }
        }
        Room.prototype.generateOptimalRoads = function() {
            var control = this.controller
            var spawn = Game.getObjectById(this.memory.origin.spawn)
            var sources = []
            var memSources = this.memory.origin.sources
            for (var i = 0; i < memSources.length; i++) {
                sources[i] = Game.getObjectById(memSources[i].id)
            }
            var roads = []
            console.log(sources.length)
            for (var i = 0; i < sources.length; i++) {
                console.log("i" + i)
                console.log(sources[i].pos.x)
                var toCtrl = this.findPath(sources[i].pos, control.pos)
                var toSpwn = this.findPath(sources[i].pos, spawn.pos)
                for (var j = 0; j < toCtrl.length; j++) {
                    roads.push({x: toCtrl[j].x, y: toCtrl[j].y})
                }
                for (var j = 0; j < toSpwn.length; j++) {
                    roads.push({x: toSpwn[j].x, y: toSpwn[j].y})
                }
            }
            roads = _.union(roads)
            this.memory.origin.plannedRoads = roads
        }
        Room.prototype.createRoadCS = function() {
            var road = this.memory.origin.plannedRoads.pop()
            this.createConstructionSites(road.x, road.y, 1, 1, STRUCTURE_ROAD)
            // for (var road in roads) {
            //     if (roads.hasOwnProperty(road)) {
            //         var r = roads[road]
            //         this.createConstructionSites(r.x, r.y, 1, 1, STRUCTURE_ROAD)
            //     }
            // }
        }
        Room.prototype.isCloseEnough = function(px, py, gx, gy, action, d) {
            var distanceNeeded = 0
            switch (action) {
                case "build":
                    distanceNeeded = 3
                    break;
                case "harvest":
                    distanceNeeded = 1
                    break;
                case "upgradeController":
                    distanceNeeded = 3
                    break;
                case "transfer":
                    distanceNeeded = 1
                    break;
                case "repair":
                    distanceNeeded = 3
                    break;
                default:

            }
            // distanceNeeded = d
            return this.withinDistance(px, py, gx, gy, distanceNeeded)
        }
        Room.prototype.withinDistance = function(px, py, gx, gy, d) {
            var west = gx - d
            var east = gx + d
            var north = gy - d
            var south = gy + d
            if(px >= west && px <= east && py >= north && py <= south) {
                return true
            } else {
                return false
            }
        }
        Room.prototype.oPath = function(x1, y1, r1, x2, y2, r2) {

        }
        Room.prototype.oPathTo = function(id1, id2) {
            var obj1 = Game.getObjectById(id1)
            var obj2 = Game.getObjectById(id2)
            this.oPath(obj1.pos.x, obj1.pos.y, obj1.pos.roomName, obj2.pos.x, obj2.pos.y, obj2.pos.roomName)
        }
        Room.prototype.findJob = function(creep) {
            if(this.memory.origin.jobs.length > 0) {
                return this.memory.origin.jobs.shift()
            } else {
                var s = Game.getObjectById(this.memory.origin.spawn);
                if(this.controller.ticksToDowngrade < 1000) {
                    return {name:"upgrade", arg:null, arg2:null}
                }
                if(s.energy == s.energyCapacity) {
                    if(this.energyAvailable == this.energyCapacityAvailable) {
                        if(_.compact(this.memory.origin.csites).length > 0) {
                            this.memory.origin.csites = _.compact(this.memory.origin.csites)
                            var csite1 = Game.getObjectById(_.compact(this.memory.origin.csites)[0])
                            // console.log(JSON.stringify(this.memory.origin.csites))
                            if(csite1 == null) {
                                this.memory.origin.csites = _.compact(this.memory.origin.csites)
                                csite1 = Game.getObjectById(this.memory.origin.csites[0])
                            }
                            if(csite1 != null) {
                                var needed1 = Math.min(csite1.progressTotal - csite1.progress, creep.carryCapacity)
                                return {name: "build", arg: csite1.id, arg2: needed1}
                            }
                        }
                        var rsites = this.find(FIND_STRUCTURES, {filter: function(sobj) {
                            return sobj.structureType != STRUCTURE_WALL && sobj.hits < sobj.hitsMax
                        }}).sort((a, b) => (a.hits / a.hitsMax) - (b.hits / b.hitsMax))
                        if(rsites.length > 0) {
                            var rsite = rsites[0]
                            var needed1 = Math.min(rsite.hitsMax - rsite.hits, creep.carryCapacity)
                            return {name:"repair", arg: rsite, arg2: needed1}
                        } else {
                            return {name:"upgrade", arg:null, arg2:null}
                        }
                    }
                }
                return {name:"feed", arg: this.memory.origin.spawn, arg2: Math.min(creep.carryCapacity, s.energyCapacity-s.energy)}
                // return this.memory.origin.defaultJob
            }
        }
        Room.prototype.obituary = function(name) {
            if(name.indexOf(" #") > -1) {
                var n = name.substring(0, name.indexOf(" #")+2) + (parseInt(name.substr(name.indexOf(" #")+2)) + 1)
                this.memory.origin.obit.push(n)
            } else {
                this.memory.origin.obit.push(name + " #2")
            }
            console.log(name)
        }
        StructureSpawn.prototype.initOrigin = function() {
            this.memory.origin = {spawning: false, ticks: 0}
        }
        StructureSpawn.prototype.tickOrigin = function() {
            this.memory.origin.ticks++
        }
        Creep.prototype.step = function(stepID) {
            switch (stepID) {
                case "releaseSource":
                    if(this.memory.origin.job.assignedSource != null) {
                        this.room.sourceRelease(this.memory.origin.job.assignedSource)
                        this.memory.origin.job.assignedSource = null;
                    }
                    return 0;
                    break;
                case "requestSource":
                    this.step("releaseSource")
                    this.memory.origin.job.assignedSource = this.room.sourceRequest();
                    if(this.memory.origin.job.assignedSource != null) {
                        return 0;
                    } else {
                        return 1
                    }
                    break;
                case "mineSource":
                    var obj = Game.getObjectById(this.memory.origin.job.assignedSource)
                    var mr = this.harvest(obj)
                    if(mr == ERR_NOT_IN_RANGE) {
                        this.moveTo(obj)
                    }
                    if(this.carry.energy >= this.memory.origin.job.mineTill) {
                        return 0
                    } else {
                        return 1;
                    }
                    break;
                case "build":
                    var obj = Game.getObjectById(this.memory.origin.job.assignedCSite)
                    var mr = this.build(obj)
                    if(mr == ERR_NOT_IN_RANGE) {
                        this.moveTo(obj)
                    } else if(mr == ERR_INVALID_TARGET) {
                        return 0
                    }
                    // this.say(this.carry.energy)
                    if(this.carry.energy == 0) {
                        return 0
                    } else {
                        return 1;
                    }
                    break;
                case "repair":
                    var obj = Game.getObjectById(this.memory.origin.job.assignedCSite)
                    var mr = this.repair(obj)
                    if(mr == ERR_NOT_IN_RANGE) {
                        this.moveTo(obj)
                    } else if(mr == ERR_INVALID_TARGET) {
                        return 0
                    }
                    // this.say(this.carry.energy)
                    if(this.carry.energy == 0) {
                        return 0
                    } else {
                        return 1;
                    }
                    break;
                case "feed":
                    // this.say("hi")
                    var obj = Game.getObjectById(this.memory.origin.job.assignedFeed)
                    var mr = this.transfer(obj, RESOURCE_ENERGY)
                    if(mr == ERR_NOT_IN_RANGE) {
                        this.moveTo(obj)
                    } else if(mr == ERR_FULL) {
                        return 0
                    }
                    // this.say(this.carry.energy)
                    if(this.carry.energy == 0) {
                        return 0
                    } else {
                        return 1;
                    }
                    break;
                case "upgrade":
                    var obj = this.room.controller
                    var mr = this.upgradeController(obj)
                    if(mr == ERR_NOT_IN_RANGE) {
                        this.moveTo(obj)
                    }
                    if(this.carry.energy == 0) {
                        return 0
                    } else {
                        return 1;
                    }
                    break;
                default:
                    return -2;
            }
        }
        Creep.prototype.job = function(name, arg, arg2) {
            // this.say(name)
            // console.log(this.name + ":" + name)
            switch (name) {
                case "feed":
                    this.memory.origin.job.mineTill = arg2;
                    this.memory.origin.job.assignedFeed = arg;
                    return ["requestSource", "mineSource", "releaseSource", "feed"]
                case "upgrade":
                    this.memory.origin.job.mineTill = this.carryCapacity
                    return ["requestSource", "mineSource", "releaseSource", "upgrade"]
                case "build":
                    this.memory.origin.job.mineTill = arg2;
                    this.memory.origin.job.assignedCSite = arg;
                    return ["requestSource", "mineSource", "releaseSource", "build"]
                case "repair":
                    this.memory.origin.job.mineTill = arg2
                    this.memory.origin.job.assignedStruct = arg
                    return ["requestSource", "mineSource", "releaseSource", "repair"]
                    break;
                default:

            }
            // feed: ["requestSource", "mineSource", "releaseSource"]
        }
        Creep.prototype.initOrigin = function() {
            this.memory.origin = {working: false, ticks: 0}
        }
        Creep.prototype.tickOrigin = function() {
            // if(this.memory.origin == null) {
            //     this.initOrigin()
            // }
            this.memory.origin.ticks++
            if(this.ticksToLive == 10) {
                this.room.obituary(this.name);
                var dmessages = [
                    // "goodbye glorious world",
                    // "origin, remember me",
                    "master \u2639",
                    "origin \u2639",
                    "\u2639"
                ]
                var deathMessageID = Math.floor(Math.random()*dmessages.length)
                this.say(dmessages[deathMessageID])
                if(this.memory.origin.job != null) {
                    if(this.memory.origin.job.assignedSource != null) {
                        this.room.sourceRelease(this.memory.origin.job.assignedSource)
                        this.memory.origin.job.assignedSource = null;
                    }
                }
            }
            if(this.ticksToLive == 9) {
                this.suicide()
            }
            if(this.memory.origin.working == false) {
                //Do something by default
                var j = this.room.findJob(this);
                this.setJob(j.name, j.arg, j.arg2)
            } else {
                this.doStep()
            }
        }
        Creep.prototype.setJob = function(jobName, arg, arg2) {
            this.memory.origin.job = {}
            var job = this.job(jobName, arg, arg2)
            this.memory.origin.job.steps = job;
            this.memory.origin.job.stepInd = 0;
            this.memory.origin.working = true;
        }
        Creep.prototype.doStep = function() {
            var step = this.memory.origin.job.steps[this.memory.origin.job.stepInd];
            var sr = this.step(step)
            // this.say(sr)
            if(sr == 0) {
                this.memory.origin.job.stepInd++;
                // this.say(this.memory.origin.job.stepInd)
                if(this.memory.origin.job.stepInd == this.memory.origin.job.steps.length) {
                    this.memory.origin.job = null;
                    this.memory.origin.working = false;
                }
            } else if (sr < 0) {
                // this.say(sr);
            }
        }
        // Creep.prototype.doStep = function() {
        //     var step = this.memory.origin.job.steps[this.memory.origin.job.stepInd];
        //     // console.log(JSON.stringify(step))
        //     // console.log(JSON.stringify(this.memory.origin.job.stepVars))
        //     console.log(JSON.stringify(step))
        //     this.memory.origin.job.steprets[this.memory.origin.job.stepInd.toString()] = global.Origin.Util.rGet(this, step.funcName).apply(this, this.memory.origin.job.stepVars[this.memory.origin.job.stepInd])
        // }
        // Creep.prototype.setJob = function(jobName) {
        //     if(global.Origin.Job[jobName]) {
        //         for (var i = 0; i < global.Origin.Job[jobName].bodyNeeded.length; i++) {
        //             if(this.body.find((e,i,a) => e.type == global.Origin.Job[jobName].bodyNeeded[i]) == false) {
        //             // if(!this.body.includes(global.Origin.Job[jobName].bodyNeeded[i])) {
        //                 // console.log(this.body)
        //                 // console.log(global.Origin.Job[jobName].bodyNeeded[i])
        //                 return ERR_NO_BODYPART
        //             }
        //         }
        //         this.memory.origin = {}
        //         this.memory.origin.working = true
        //         var job = global.Origin.Job[jobName]
        //         this.memory.origin.job = {
        //             steps: job.steps,
        //             variables: {},
        //             stepVars: {},
        //             stepInd: 0,
        //             steprets: {}
        //         }
        //         for (var vi in job.variables) {
        //             if (job.variables.hasOwnProperty(vi)) {
        //                 this.memory.origin.job.variables[vi] = job.variables[vi]
        //             }
        //         }
        //         for(var si in this.memory.origin.job.steps) {
        //             var step = this.memory.origin.job.steps[si]
        //             this.memory.origin.job.stepVars[si] = [];
        //             for(var svi in step.argsDefault) {
        //                 var arg = step.argsDefault[svi]
        //                 var arg2 = ""
        //                 // if(arg.includes(">")) {
        //                 //     arg2 = arg.substring(arg.indexOf(">")+1)
        //                 //     arg = arg.substring(0, arg.indexOf(">"))
        //                 // }
        //                 if(arg.startsWith("$")) {
        //                     // console.log(arg)
        //                     this.memory.origin.job.stepVars[si][svi] = global.Origin.Util.rGet(global, arg.substr(1))
        //                     // this.memory.origin.job.stepVars[si][svi]
        //                 } else if(arg.startsWith("!")) {
        //                     this.memory.origin.job.stepVars[si][svi] = global.Origin.Util.rGet(global, arg.substr(1))()
        //                 } else if(arg.startsWith("%")) {
        //                     this.memory.origin.job.stepVars[si][svi] = global.Origin.Util.rGet(this, arg.substr(1))
        //                 } else if(arg.startsWith("^")) {
        //                     this.memory.origin.job.stepVars[si][svi] = global.Origin.Util.rGet(this, arg.substr(1))()
        //                 } else if(arg.startsWith("#")) {
        //                     this.memory.origin.job.stepVars[si][svi] = parseInt(arg.substr(1))
        //                 } else if(arg.startsWith("/")) {
        //                     this.memory.origin.job.stepVars[si][svi] = [arg.substr(1)]
        //                     // console.log(arg.substr(1))
        //                 }
        //                 // stepVars[si][svi] =
        //             }
        //         }
        //     } else {
        //         return ERR_INVALID_ARGS
        //     }
        // }
    },
    initiate: function() {
        module.exports.assemble()
        Memory.Origin = {}
        Memory.Origin.Profiler = {
            Active: false,
            Enabled: {
                LongTerm: false,
                ShortTerm: false
            },
            Scans: {
                LongTerm: -1,
                ShortTerm: -1,
                Manual: -1
            }
        }
        Memory.Origin.Rooms = []
        for (var rn in Game.rooms) {
            if (Game.rooms.hasOwnProperty(rn)) {
                Memory.Origin.Rooms.push(rn)
                Game.rooms[rn].initOrigin()
                // console.log(rn)
            }
        }
        return "Thank you"
    },
    develop: function() {
    },
    energize: function() {

    },
    troubleshoot: function() {
        if(Memory.Origin.Profiler.Scans.LongTerm > -1) {
            Memory.Origin.Profiler.Scans.LongTerm--
        }
        if(Memory.Origin.Profiler.Scans.ShortTerm > -1) {
            Memory.Origin.Profiler.Scans.ShortTerm--
        }
        if(Memory.Origin.Profiler.Scans.Manual > -1) {
            Memory.Origin.Profiler.Scans.Manual--
        }
        if(Memory.Origin.Profiler.Active) {
            if(Memory.Origin.Profiler.Scans.Manual > -1) {
                return
            } else {
                if(Game.time % 500 == 0 && Memory.Origin.Profiler.Enabled.LongTerm) {
                    //Game.profiler.email(1000)
                    console.log("PROFILING FOR 100")
                    Memory.Origin.Profiler.Scans.LongTerm = 100
                }
                if(Memory.Origin.Profiler.Scans.LongTerm > -1) {
                    return
                } else {
                    if(Game.time % 50 == 0 && Memory.Origin.Profiler.Enabled.ShortTerm) {
                        //Game.profiler.email(100)
                        console.log("PROFILING FOR 10")
                        Memory.Origin.Profiler.Scans.ShortTerm = 10
                    }
                }
            }
        }
    },
    update: function() {
        if(Memory.Origin == undefined) {
            if(Memory.startMessage == undefined) {
                console.log("<h1 style='width: 100vw; text-align: center; color: red;'>Your attention please</h1>" + "<h2 style='text-align: center;'>Origin has not been initiated</h2>" + "<h2 style='text-align: center;'>To initiate Origin, please issue the following command</h2>" + "<h2 style='text-align: center; color: cyan;'>require(\"origin\").initiate()")
                Memory.startMessage = true
            }
        } else {
            Memory.startMessage = false;
        }
        if(Memory.Origin != undefined) {
            // profiler.wrap(function() {
            //     Origin.update()
            // })
            module.exports.assemble()
            //module.exports.troubleshoot()
            global.Origin.tickOrigin()
        }
    }
}
