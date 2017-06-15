var express = require('express');
var app = express();
var fs  = require('fs');
var path = require('path');

app.set('view engine', 'ejs');

var bodyParser = require('body-parser')
app.use(bodyParser.json());      
app.use(bodyParser.urlencoded({  
  extended: true   
})
); 

/*database mongoose connectivity*/
var mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1/usersschema');
var db = mongoose.connection;

db.on('error', function(err) {
	console.log('connection error', err);
});

db.once('open', function() {
	console.log('connected to mongodb');
})


/*uploading the document */
var Grid = require('mongoose-gridfs')({
    collection:'attachments',
    model:'Attachment'
 });

app.use(express.static(path.join(__dirname, '/www')));

app.use('/uploads', express.static(path.join(__dirname + '/uploads')));


//ep -- handle resume upload
app.post('/resume/upload', function(req,res){
    console.log("Start uploading resume!")
    resumeName = req.file.filename;
    console.log(resumeName);
    var dirname = require('path').dirname(__dirname)+'/uploads';
    var filename = resumeName;    
    var read_stream =  fs.createReadStream(dirname + '/' + filename);
    var file = Grid.model;
    file.write({
     		filename: filename
     	},
     	read_stream,
     	function(error, createdFile) {
     		if(error) {
     			console.log(error);
     		} 
     		if (createdFile) {
     			console.log(createdFile);
                resumeID = createdFile._id;
     			res.json(resumeID);			//sending the id of resume to front end after uploading
     		}
     	}
    );
});

//ep -- retrieve resume of candidate
app.get('/resume/download/:id', function(req,res){
    console.log('downloading')
      var resumeID = req.params.id;  
      var file=Grid.model;
       file.readById(resumeID, function (err, data) {
        console.log("Downloading resume " + resumeID);
        if (err) {
            res.json(err);
        }
        if (data.length > 0) {
            res.send(data);
            
        } else {
            res.json('File Not Found!');
        }
    });
});




/*creating schema for job*/
var Schema = mongoose.Schema;
var jobSchema = new Schema({
    Position: String,
    Company : String,
    Technology: String,
    Requirements : String,
    Level: String,
	Location: String,
});
var Job = mongoose.model('Job', jobSchema);
var job1 = new Job({
	Position: 'Lead',
    Company : 'Tesla',
    Technology: 'AngularJS, CSS',
    Requirements : '3-7 years, JIRA',
    Level: 'Associate',
	Location: 'San Jose',
});
job1.save(function(err, data) {
	if(err)
		console.log('err');
	else
		console.log('saved', data);
});


/* creating schema for candidate as user*/
var userSchema = new Schema({
    FirstName: String,
    LastName : String,
    Experience: Number,
    Technologies : String,
    age : Number,
    sex : String,
    resume: String,
});

var User = mongoose.model('User', userSchema);
var user1 = new User({
	FirstName: 'Sharmila',
    LastName : 'Guna',
    Experience: 5,
    Technologies : 'js, react, angular, html, css, SQL',
    age : 26,
    sex : 'F',
    resume: null,
});
user1.save(function(err, data) {
	if(err)
		console.log('err');
	else
		console.log('saved', data);
});




var router = express.Router();
/*endpoint to open home page -- job list*/
router.get('/jobhunt', function(req, res) {
	console.log("in job hunt home page");
	res.sendfile('public/html/jobs.html');
});


router.route('/jobhunt/jobs')
/*endpoint to send job details to home page*/
	.get(function(req, res) {
		console.log("in jobs home page - get ");
		Job.find({},{}, function(err, docs) {
			console.log('the users list: ' + docs);
			res.send(docs);
		});
	})


router.route('/jobhunt/jobsadd')
/*ep -- redirect to add new job*/
	.get(function(req, res) {
		console.log("creating user ");
        res.sendfile('public/html/jobcreate.html');
		})

/*ep --  handle submit new job */
	.post(function(req, res) {
		console.log("in jobs page  - post ");
		var job = new Job();
		job.Position = req.body.Position;
		job.Company = req.body.Company;
		job.Technology = req.body.Technology;
		job.Requirements = req.body.Requirements;
		job.Level = req.body.Level;
		job.Location = req.body.Location;
		job.save(function(err) {
			if(err)
				res.send(err);
			res.json({message : 'job created'});
		});
	});


router.route('/jobhunt/jobs/:job_id')
/*ep --  redirect to edit a job*/
	.get(function(req, res) {
        Job.findById(req.params.job_id, function(err, user) {
            if (err) {
                res.send('error while in route taking parameter value',err);
                console.log('error while in route taking parameter value');
            }
            else
            {
            	var ID = job._id;
            	var Position = user.Position;
            	var Company = job.Company
            	var Technology = job.Technology;
            	var Requirements = job.Requirements;
            	var Level = job.Level;
            	var Location = job.Location;
            	console.log('parameter passed to edit user page', id);
	            res.render('editJob', { 
					ID : ID,
		        	Position : Position,
		        	Company : Company,
		        	Technology : Technology,
		        	Requirements : Requirements,
		        	Level : Level,
		        	Location : Location
				});
        	}
        });
    })
/*ep --  update job*/
	.put(function(req, res) {
		Job.findById(req.params.job_id, function(err, user) {
			console.log("updating job: " + req.params.job_id);
			if(err) {
				console.log("error updating job: " + req.params.job_id);
				res.send(err);
			} else {
				/*position and company cant be changed*/
				job.Technology = req.body.Technology;
				job.Requirements = req.body.Requirements;
				job.Level = req.body.Level;
				job.Location = req.body.Location;
				user.save(function(err) {
					if(err) {
						console.log("error updating job: " + req.params.job_id);
						res.send(err);
					} else {
						console.log("successfully updated job: " + req.params.job_id);
						res.json({message : 'Job updated'});
					}
				});
			}
			
		});
	})

/*ep --  remove job*/
	.delete(function(req, res) {
		Job.findById(req.params.job_id, function(err, user) {
			console.log(' inside delete function for parameter' , req.params.job_id);
			if(err || !job) {
				console.log('stuck with error inside delete function');
				res.send(err);
			}
			else {
				console.log('ready to delete ' + job);
				job.remove(function(err) {
					if(err) {
						console.log('cannot remove. stuck here');
						res.send('the value of error',err);
					}
					else {
						console.log('deleted');
						res.json({message : 'Job deleted'});
					}
				});
			}
		});
	});





/*endpoints for the candidate */

router.route('/candidate')

/*ep -- redirect to create candidate*/
	.get(function(req, res) {
		console.log("in candidate page");
		res.sendfile('public/html/candidateAdd.html');
	})

/* ep -- submit a candidate*/
	.post(function(req, res) {
		console.log("in candidate page - post ");
		var user = new User();
		user.FirstName = req.body.FirstName;
		user.LastName = req.body.LastName;
		user.Experience = req.body.Experience;
		user.Technologies = req.body.Technologies;
		user.age = req.body.age;
		user.sex = req. body.sex;
		user.resume = req.body.resume;

		user.save(function(err) {
			if(err)
				res.send(err);
			res.json({message : 'User created'});
		});
	});

app.use(express.static(path.join(__dirname, 'public')));
app.use('/', router);


app.listen(8081);

