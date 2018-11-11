import React from 'react';
import {
  ActivityIndicator,
  Button,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  ScrollView,
  View,
  Dimensions,
} from 'react-native';
import { ImagePicker, Permissions } from 'expo';
import * as firebase from 'firebase';

// this is to avoid all the yellow warnings of expo
console.disableYellowBox = true;

// firebase configurations for the project
const firebaseConfig = {
  apiKey: "AIzaSyB-WNogLywSkad69Ex9-ZxsJucQ0TeVYy0",
    authDomain: "tagmosquito.firebaseapp.com",
    databaseURL: "https://tagmosquito.firebaseio.com",
    projectId: "tagmosquito",
    storageBucket: "tagmosquito.appspot.com",
    messagingSenderId: "415327492570"
};

// initializing the firebase instance here
firebase.initializeApp(firebaseConfig);

// stylesheet
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    marginTop: 10,
    marginBottom: 10,
  },
  empty: {
    height: 10,
  },
  bigText: {
    fontSize: 18,
  },
  imageContainer: {
    borderTopRightRadius: 3,
    borderTopLeftRadius: 3,
    shadowColor: 'rgba(0,0,0,1)',
    shadowOpacity: 0.2,
    shadowOffset: { width: 4, height: 4 },
    shadowRadius: 5,
    flexDirection: 'row'
  }

})

export default class App extends React.Component {

  // state will be keeping variables like image, uploading and the tag
  state = {
    images: [],
    tags: ['Classifying', 'Classifying', 'Classifying'],
    uploading: false,
    tag: "",
  };
  
  // asking for permissions for the camera and camera roll
  async componentDidMount() {
    
    await Permissions.askAsync(Permissions.CAMERA_ROLL);
    await Permissions.askAsync(Permissions.CAMERA)
    // let the user know that app won't work without it
    .catch((error) => {
      alert("You did not allow the camera!")
    });
  
  }

  render() {
    return (
    
      <View style = {styles.container}>
        {this._maybeRenderUploadingOverlay()}
        <Button
          style = {styles.button} 
          onPress={this._takePhoto} 
          title="Take a photo"/>

          <View style={styles.empty}></View>
          
        <Button
          style={styles.button}
          onPress={this._pickImage}
          title="Pick images from camera roll"/>

          <View style={styles.empty}></View>

        {this._maybeRenderImage()}
        
          
        <View style={styles.empty}></View>

        {this.state.images.length > 0 ? this.state.images.length <= 0 : (
          <Text style={styles.bigText}>
            Take or choose a photo to classify
          </Text>
        )}
        <StatusBar barStyle="default" />
      </View>
     
    
    );
  }
  makeid() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  
    for (var i = 0; i < 10; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));
  
    return text;
  }

  _maybeRenderUploadingOverlay = () => {
    // some animation for the uploading
    if (this.state.uploading) {
      return (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: 'rgba(0,0,0,0.4)',
              alignItems: 'center',
              justifyContent: 'center',
            },
          ]}>
          <ActivityIndicator color="#fff" animating size="large" />
        </View>
      );
    }
  };

    // if the image is ready, show it to the user
  _maybeRenderImage = () => {
    // check if the image is there
    let { images } = this.state;
    if (images.length <= 0) {
      // if not return nothing
      return;
    }
   
    return (
      <View style = {{flex: -1, alignContent: 'center', justifyContent: 'center'}}>
        <View style={styles.imageContainer}>
        { images.map((data, index) => {
            return (
              <View
                style={styles.imageContainer}>
                <View style={{flex: 0, flexDirection: 'column'}}>
                <Image source={{ uri: data.url }} style={{ marginLeft: 5, marginRight: 5, width: 120, height: 120 }}/>
                <Text>{this.state.tags[index+1]}</Text>
                </View>
              </View>  
            )
        })  }
        </View>
        
        <View style={styles.empty}></View>

        <View style= {{flex: 0, flexDirection: 'column', alignContent: 'center', justifyContent: 'center'}}> 
        
          <View style={styles.empty}></View>

          <Button
          style = {styles.button}
          onPress = {this._clear}
          title="Clear"/>
        </View>
      </View>
    );
  };



  // clear the image from the view
  _clear = () => {
    this.setState({
      images: [],
      tags: [],
    })
  }

  // invoke the camera and handle the result
  _takePhoto = async () => {
    if(this.state.images.length < 3){
      let pickerResult = await ImagePicker.launchCameraAsync({});
      this._handleImagePicked(pickerResult);
    }
    else{
      alert('No more than 3 images!');
    }
    
  };

  // invoke the image picker and handle the result
  _pickImage = async () => {
    if(this.state.images.length < 3){
      let pickerResult = await ImagePicker.launchImageLibraryAsync({});
      this._handleImagePicked(pickerResult);
    }
    else{
      alert('No more than 3 images')
    }
  };

  // handle the image includes parsing it as image, then sending it to the database, 
  // as well as updating the state when the result comes in
  _handleImagePicked = async pickerResult => {
    try {
      // turn on the uploading view
      this.setState({ uploading: true });
      // if the picture was valid
      if (!pickerResult.cancelled) {
        
        let index = this.state.images.length + 1;
        let imageId = this.makeid();
        console.log(imageId)
        // upload the image to the storage and get the url
        uploadUrl = await uploadImageAsync(pickerResult.uri, imageId);
        // set the app state to the following
        
        const image = {
          url: uploadUrl,
          index: imageId,
        }
        this.setState({images: [...this.state.images, image]});
        // upload new json object to the firebase realtime database
        firebase.database().ref('outputs/' + image.index).on('value', (data) => {
          const tags = Array.from(this.state.tags);
          console.log("Updating index: " + index);
          tags[index] = data.child("result").val();
          console.log(tags[index]);
         // tags.splice(index, 0, data.child("result").val());
          this.setState({ tags: tags});
        })

      }
      else{
        alert("No picture captured");
      }
    } catch (e) {
      console.log(e);
      alert('Upload failed, sorry :(');
    } finally {
      // turn off the uploading view
      this.setState({ uploading: false });
    }
  };
}

// uploads the blob to the firebase storage
async function uploadImageAsync(uri, index) {
  const response = await fetch(uri);
  const blob = await response.blob();
  const ref = firebase
    .storage()
    .ref()
    .child(index+'.jpg')
  const snapshot = await ref.put(blob);
  // put the result tag in the database
  const fire = firebase.database().ref('images/')
  fire.child(index+ '/').set({
    result: "Classifying..."
  })

  firebase.database().ref('outputs/' + index + '/').set({
    result: "Classifying..."
  })
  
  return snapshot.downloadURL;
}
