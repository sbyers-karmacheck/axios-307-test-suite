import inquirer from 'inquirer';
import { IInquireResponse } from './interfaces';

export function prompt(files: string[]): Promise<IInquireResponse> {
  return inquirer.prompt<IInquireResponse>([{
    type: "checkbox",
    name: "files",
    message: "Which configurations?",
    choices: files.map(file => {
      const [, nodeVer, axiosVer] = file.match("^.*?\-(node[0-9]{1,2})_(.*?)$") || [];
      return {
        value: file,
        name: `${nodeVer} - axios ${axiosVer}`,
        checked: true
      };
    })
  }, {
    type: "list",
    name: "action",
    message: "Choose an option",
    choices: [
      {
        name: "Build and Run",
        value: 0
      },
      {
        name: "Build Only",
        value: 1
      },
      {
        name: "Run Only",
        value: 2
      }
    ]
  }, {
    type: "confirm",
    name: "debug",
    message: "Debug mode?",
    default: false
  },
  {
    type: "confirm",
    name: "cleanup",
    message: "Cleanup Images?",
    default: false
  }]);
}