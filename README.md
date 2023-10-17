

# How to run the project
A brief description on how to generate the necessary files and run the project

**Start by cloning the project and navigate to the root folder**

Navigate into the server folder ```cd server``` and install the required dependencies using  ```npm install```

To verify the installation, run the tests with - ```npm test```
If it mentions any import errors, check the row for **Service** and **Router** in the **File Organisation** further below.

To run the server - ```npm run dev```


***In a seperate window do the same for the client***

Navigate into the client folder ```cd client``` and install the required dependencies using ```npm install```

To run the client server - ```npm start```


# Generate the documentation for the server
**Starting from the root folder**

Navigate to the server folder ```cd server```

Make sure the required dependencies are installed by running ```npm install```

Run the *builddocs.bat* file to transpile the .ts files and build the documentation.
The documentation will be outputted under server/DOCS

The *builddocs.bat* file runs ```npx tsc``` which transpiles ***.ts*** to ***.js*** and ```jsdocs folder1 folder2...``` which builds the documentation from the ***.js*** files in the specified folders.

# File Organisation


**Back End**
The back end is located within the 'server' folder found in the root directory. The files lying directly here are configuration files and the 'index.ts' file which is used to run the server with the aforementioned command ```npm run dev```, and 'indextest.ts' is a modified version for the Router tests which are run with the command ```npm test```.

The **Models** of the website are located - starting at /server - within the ```model``` folder and contain interfaces and classes that the back-end uses.

The **Database** schemas for MongoDB are located in the folder ```db```and use the models as templates. In here is also where the connection file is stored, which should be changed to connect to your own database.

The **Service** layer is located within the ```service``` folder and contain the ```Account```,```Forum```, and ```Post```services. The post service also incorporates the comment services. The filenames should be of the form ```postService```, as in the first letter is lowercase since that's what the imports are based on (this is a common bug, where the files get - for whatever reason - an uppercase letter after fetching).

The **Router** layer is located within the ```router``` folder and contain a router for the ```Forums```, ```Login```, ```Posts & Comments```, and for the```Settings```. As mentioned for the service files, these files should be named of the form as mentioned above to prevent import errors.

And lastly, the **Tests** are located within the ```tests``` folder. These test the service & router layer, and also controls the effects by fetching data from the database to verify expected changes.
