Welcome to the GitHub repository for NodeFullBackup, the all-encompassing package designed for your data preservation needs. NodeFullBackup offers a seamless solution for taking database and file backups concurrently, ensuring comprehensive protection for your digital assets. Tailored for versatility, it’s perfect for individual developers and organizations alike, safeguarding data across various systems. Explore our documentation to learn how NodeFullBackup can fortify your backup strategy and provide a reliable safety net for your projects.

# Installation
NodeFullBackup is available as an npm package, allowing for easy installation using the command below:

```
npm i @double-man/node-full-backup
```
# Simple Usage
You can effortlessly integrate and utilize this package with a single step: simply copy the following code snippet wherever you need it

 ```ts 
 import FullBackup from  '@double-man/node-full-backup';
 
const backup = new FullBackup({
		   //backup output address
	    outputPath: path.resolve('./backup'),
	    //folders list for backup
	    folders: [path.resolve('./public')],
	    //remove backup files after 1 day
	    expireDays: '1d',
	    //take backup every 6 hours
		   cornExpression: '0 */6 * * *', 
	    database: {
			username: 'database_username',	
			password: 'database_password',
			database: 'database_name',
		    host: 'localhost',
		    port: 27017
	    }, 
   }
 });
    
 // start cronJob for backup
 backup.start();
 ```

## Parameters
NodeFullBackup offers a variety of configurable parameters to tailor the backup process to your needs. Below is a detailed table outlining all available options:

| Parameter | Type | Description |
|-----------|------|-------------|
| `outputPath` | String* | The destination folder path for the backup files. |
| `outputNamePrefix` | String | A prefix for the backup file names. |
| `cronExpression` | String | The cron expression for scheduling backups. |
| `outputType` | String | The format of the output file: 'zip' or 'tar'. |
| `files` | String[] | An array of file paths to include in the backup. |
| `folders` | String[] | An array of folder paths to include in the backup. |
| `expireDays` | String | The number of days after which old backup files will be removed. |
| `afterBackup` | Function(filePath) | A callback function that provides access to the backup file path after each backup operation. |
| `database` | Object | Properties for database configuration are detailed in the subsequent table. |

### Database Object Properties
Configure your database settings using the properties listed in the table below:

| Parameter | Type | Description |
|-----------|------|-------------|
| `username` | String | The username for database access. |
| `password` | String | The password for database access. |
| `database` | String* | The name of the database to back up. |
| `host`     | String* | The host address of the database. |
| `port`     | Number  | The port number for connecting to the database. |

\* Required fields
# Upload Backup To GoogleDrive
To automatically upload your backup file to Google Drive, implement the following code within the `afterBackup` callback:
```ts
import FullBackup, {uploader} from  '@double-man/node-full-backup';

const backup = new FullBackup({
		...
	    //this function will execute after each backup
		afterBackup: (filePath: string) => {
			uploader.googleDrive(path_of_google_key_json , filePath , google_drive_folder_id)
		} 
 });
    
 // start cronJob for backup
 backup.start();

```
Obtain your Google JSON key by following the instructions in [this guide](https://github.com/expo/fyi/blob/main/creating-google-service-account.md), and ensure that your Google Drive service is activated.