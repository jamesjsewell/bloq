# Bloq

Bloq is an iOS game in development. Play it [here](http://magentanova.github.io/bloq).

## Mechanics
You control the bottom row. Tap a block to flip its color. Match a row in the grid to make that row disappear. Eliminate all rows to advance to the next level. 

In subsequent levels you gain access to powerups, available to the left of the grid. As you grow more powerful, the world becomes more dangerous. With each level an extra block is added, making matches more difficult to achieve. 

## Contribute
 
Contributers are very much welcomed! Feel free to post new issues or address outstanding ones. If you have questions, you can email Justin at richards.justind at gmail dot com. 

### Todos

All of the issues currently open are either bugs or missing features. 

### Code Structure

Because Bloq is ported to iOS through Cordova, the directory structure is a little wonky. The relevant files that comprise the actual current version of the game are in `/platforms/ios/www/`. Most of the game logic is in `/platforms/ios/www/js/script.js`. CSS is in `/platforms/ios/www/styles/style.css`. 

The web version runs the exact same Javascript and CSS. It lives on the gh-pages branch, which is published as a subtree (located at `/platforms/ios/www/`) of the master branch. Learn about subtrees [here](https://www.atlassian.com/blog/git/alternatives-to-git-submodule-git-subtree).
