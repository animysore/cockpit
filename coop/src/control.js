const Telemetry = require('./telemetry');
const Station = require('../models/stations.model');
const Report = require('../models/report.model');

class Control {
    /**
     * List all the Red Hen capture sations whose config information is currently present in DB.
     */
    async listStations (req, res) {
        const stations = await Station.retrieve()
        res.json(stations);
    }

    /**
     * Check if capture station is online and refresh its status information in the DB. 
     */
    async refreshStationInfo(req, res) {
        const station = await Station.findOne({_id: req.body._id}).exec();
        if (! station) res.status(400).json({"error":"Station not found"});

        const tele = new Telemetry(station);
        const date = await tele.statusCheck();
        station.lastChecked = new Date();
        station.onlineSince = date;

        await station.save();

        //TODO : make this part of model
        const stationObj = station.toObject()
        stationObj.isOnline = date ? true : false;

        res.json(stationObj);
    }

    /**
     * Run the preloaded diagnostic health check script on the capture station.
     */
    async runDiagnostics(req, res) {
        const station = await Station.findOne({_id: req.body._id}).exec();
        if (req.body.hasOwnProperty('provideLatest') && req.body.provideLatest == true) {
            const tele = new Telemetry(station)
            const freshReport = await tele.healthCheck();
            const report = new Report();
            report.stationId = req.body._id;
            report.disks = freshReport.storage.disks;
            report.cards = freshReport.storage.cards;
            report.hdhomerun_devices = freshReport.hdhomerun_devices;
            report.security = freshReport.security;
            report.errors = freshReport.errors;    
            if (freshReport.downtimes) {
                const downtimes = [];
                for (const downtime of freshReport.downtimes) { 
                    const start = Date(Number.parseInt(downtime.start)*1000);
                    const end = Date(Number.parseInt(downtime.end)*1000);
                    downtimes.push({start, end});
                }
                report.downtimes = downtimes;
            } 
            await report.save();
            res.json(report);
        }
        else { 
            const report = await Report.find({stationId: req.body._id}).limit(1).sort({'$natural':-1});
            res.json(report);
        }
    }

    /**
     * Add a new capture station to DB
     */
    addStation(req, res) {
        const { name, location, host, port, username } = req.body;
        Station.create({ name, location, host, port, username }, (err, obj) => {
            if (err) res.status(400).json(err);
            else res.json(obj);
        });
    }

    /**
     * Edit an existing capture station
     * name, location, host, port and username are editable
    */
    async editStation(req, res) {
        const { _id, name, location, host, port, username } = req.body;
        const station = await Station.findOne({_id: _id}).exec();
        if (! station) res.status(400).json({"error":"Station not found"});

        station.name = name;
        station.location = location;
        station.host = host;
        station.port = port;
        station.username = username;
        await station.save();
        res.json(station);
    }

    /**
     * Remove existing capture station from db
     */
    async deleteStation(req, res) {
        const station = await Station.findOneAndDelete({_id:req.body._id}).exec();
        if (! station) res.status(400).json({"error":"Station not found"});

        res.json(station);
    }
}

module.exports = Control;