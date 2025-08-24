import torch
import torch.nn as nn

from torchvision.transforms import v2

from PIL import Image
import sys

class DeepNet(nn.Module):
    def __init__(self):
        super().__init__()
        #outputs of layer x must equal inputs of layer x+1
        n0=384
        n1=345
        n2=305
        n3=265
        n4=235#num of classes
        self.dropout = nn.Dropout(0.3)
        self.leakyRelu=nn.LeakyReLU()

        self.fc1 = nn.Linear(n0, n1)
        self.bn1= nn.BatchNorm1d(n1)
        
        self.fc2 = nn.Linear(n1, n2)
        self.bn2= nn.BatchNorm1d(n2)

        self.fc3 = nn.Linear(n2, n3)
        self.bn3= nn.BatchNorm1d(n3)
        
        self.fc4 = nn.Linear(n3, n4)
       
       # Weight initialisation. Apparently this should stop weights exploding or vanishing at start... makes training more stable
        nn.init.kaiming_normal_(self.fc1.weight, nonlinearity='leaky_relu')
        nn.init.kaiming_normal_(self.fc2.weight, nonlinearity='leaky_relu')
        nn.init.kaiming_normal_(self.fc3.weight, nonlinearity='leaky_relu')
        nn.init.kaiming_normal_(self.fc4.weight, nonlinearity='leaky_relu')
        for layer in [self.fc1, self.fc2, self.fc3, self.fc4]:
            if layer.bias is not None:
                nn.init.constant_(layer.bias,0.0)

    def forward(self, x):
        x = self.fc1(x)
        x = self.bn1(x)
        x = self.leakyRelu(x)
        x = self.dropout(x)
        
        x = self.bn2(self.fc2(x))
        x = self.leakyRelu(x)
        x = self.dropout(x)
        
        x = self.bn3(self.fc3(x))
        x = self.leakyRelu(x)
        x = self.dropout(x)
        
        y = self.fc4(x)
       
        return y
    
class birdClassifier():

    def __init__(self):
        #class labels
        self.class_labels = ['ABBOTTS_BABBLER', 'ABBOTTS_BOOBY', 'ABYSSINIAN_GROUND_HORNBILL', 'ACADIAN_FLYCATCHER', 'AFRICAN_CROWNED_CRANE', 'AFRICAN_EMERALD_CUCKOO', 'AFRICAN_FIREFINCH', 'AFRICAN_OYSTER_CATCHER', 'AFRICAN_PIED_HORNBILL', 'AFRICAN_PYGMY_GOOSE', 'ALBATROSS', 'ALBERTS_TOWHEE', 'ALEXANDRINE_PARAKEET', 'ALPINE_CHOUGH', 'ALTAMIRA_YELLOWTHROAT', 'AMERICAN_AVOCET', 'AMERICAN_BITTERN', 'AMERICAN_COOT', 'AMERICAN_CROW', 'AMERICAN_FLAMINGO', 'AMERICAN_GOLDFINCH', 'AMERICAN_KESTREL', 'AMERICAN_PIPIT', 'AMERICAN_REDSTART', 'AMERICAN_THREE_TOED_WOODPECKER', 'ANNA_HUMMINGBIRD', 'ARTIC_TERN', 'BAIRD_SPARROW', 'BALTIMORE_ORIOLE', 'BANK_SWALLOW', 'BARN_SWALLOW', 'BAY_BREASTED_WARBLER', 'BELTED_KINGFISHER', 'BEWICK_WREN', 'BLACK_AND_WHITE_WARBLER', 'BLACK_BILLED_CUCKOO', 'BLACK_CAPPED_VIREO', 'BLACK_FOOTED_ALBATROSS', 'BLACK_TERN', 'BLACK_THROATED_BLUE_WARBLER', 'BLACK_THROATED_SPARROW', 'BLASTI', 'BLUE_GROSBEAK', 'BLUE_HEADED_VIREO', 'BLUE_JAY', 'BLUE_WINGED_WARBLER', 'BOAT_TAILED_GRACKLE', 'BOBOLINK', 'BOHEMIAN_WAXWING', 'BONEGL', 'BRANDT_CORMORANT', 'BREWER_BLACKBIRD', 'BREWER_SPARROW', 'BRHKYT', 'BRONZED_COWBIRD', 'BROWN_CREEPER', 'BROWN_PELICAN', 'BROWN_THRASHER', 'CACTUS_WREN', 'CALIFORNIA_GULL', 'CANADA_WARBLER', 'CAPE_GLOSSY_STARLING', 'CAPE_MAY_WARBLER', 'CARDINAL', 'CAROLINA_WREN', 'CASPIAN_TERN', 'CBRTSH', 'CEDAR_WAXWING', 'CERULEAN_WARBLER', 'CHESTNUT_SIDED_WARBLER', 'CHIPPING_SPARROW', 'CHUCK_WILL_WIDOW', 'CLARK_NUTCRACKER', 'CLAY_COLORED_SPARROW', 'CLIFF_SWALLOW', 'CMNMYN', 'COMMON_RAVEN', 'COMMON_TERN', 'COMMON_YELLOWTHROAT', 'CRESTED_AUKLET', 'DARK_EYED_JUNCO', 'DOWNY_WOODPECKER', 'EARED_GREBE', 'EASTERN_TOWHEE', 'ELEGANT_TERN', 'EUROPEAN_GOLDFINCH', 'EVENING_GROSBEAK', 'FIELD_SPARROW', 'FISH_CROW', 'FLORIDA_JAY', 'FORSTERS_TERN', 'FOX_SPARROW', 'FRIGATEBIRD', 'GADWALL', 'GEOCOCCYX', 'GLAUCOUS_WINGED_GULL', 'GOLDEN_WINGED_WARBLER', 'GRASSHOPPER_SPARROW', 'GRAY_CATBIRD', 'GRAY_CROWNED_ROSY_FINCH', 'GRAY_KINGBIRD', 'GREAT_CRESTED_FLYCATCHER', 'GREAT_GREY_SHRIKE', 'GREEN_JAY', 'GREEN_KINGFISHER', 'GREEN_TAILED_TOWHEE', 'GREEN_VIOLETEAR', 'GRETIT', 'GROOVE_BILLED_ANI', 'HARRIS_SPARROW', 'HEERMANN_GULL', 'HENSLOW_SPARROW', 'HERRING_GULL', 'HILPIG', 'HIMBUL', 'HIMGRI', 'HOODED_MERGANSER', 'HOODED_ORIOLE', 'HOODED_WARBLER', 'HORNED_GREBE', 'HORNED_LARK', 'HORNED_PUFFIN', 'HOUSE_SPARROW', 'HOUSE_WREN', 'HSPARO', 'INDIGO_BUNTING', 'INDVUL', 'IVORY_GULL', 'JGLOWL', 'KENTUCKY_WARBLER', 'LAYSAN_ALBATROSS', 'LAZULI_BUNTING', 'LBICRW', 'LEAST_AUKLET', 'LEAST_FLYCATCHER', 'LEAST_TERN', 'LE_CONTE_SPARROW', 'LINCOLN_SPARROW', 'LOGGERHEAD_SHRIKE', 'LONG_TAILED_JAEGER', 'LOUISIANA_WATERTHRUSH', 'MAGNOLIA_WARBLER', 'MALLARD', 'MANGROVE_CUCKOO', 'MARSH_WREN', 'MGPROB', 'MOCKINGBIRD', 'MOURNING_WARBLER', 'MYRTLE_WARBLER', 'NASHVILLE_WARBLER', 'NELSON_SHARP_TAILED_SPARROW', 'NIGHTHAWK', 'NORTHERN_FLICKER', 'NORTHERN_FULMAR', 'NORTHERN_WATERTHRUSH', 'OLIVE_SIDED_FLYCATCHER', 'ORANGE_CROWNED_WARBLER', 'ORCHARD_ORIOLE', 'OVENBIRD', 'PACIFIC_LOON', 'PAINTED_BUNTING', 'PALM_WARBLER', 'PARAKEET_AUKLET', 'PELAGIC_CORMORANT', 'PHILADELPHIA_VIREO', 'PIED_BILLED_GREBE', 'PIED_KINGFISHER', 'PIGEON_GUILLEMOT', 'PILEATED_WOODPECKER', 'PINE_GROSBEAK', 'PINE_WARBLER', 'POMARINE_JAEGER', 'PRAIRIE_WARBLER', 'PROTHONOTARY_WARBLER', 'PURPLE_FINCH', 'REBIMG', 'RED_BELLIED_WOODPECKER', 'RED_BREASTED_MERGANSER', 'RED_COCKADED_WOODPECKER', 'RED_EYED_VIREO', 'RED_FACED_CORMORANT', 'RED_HEADED_WOODPECKER', 'RED_LEGGED_KITTIWAKE', 'RED_WINGED_BLACKBIRD', 'RHINOCEROS_AUKLET', 'RINGED_KINGFISHER', 'RING_BILLED_GULL', 'ROCK_WREN', 'ROSE_BREASTED_GROSBEAK', 'RUBY_THROATED_HUMMINGBIRD', 'RUFOUS_HUMMINGBIRD', 'RUSTY_BLACKBIRD', 'SAGE_THRASHER', 'SAVANNAH_SPARROW', 'SAYORNIS', 'SCARLET_TANAGER', 'SCISSOR_TAILED_FLYCATCHER', 'SCOTT_ORIOLE', 'SEASIDE_SPARROW', 'SHINY_COWBIRD', 'SLATY_BACKED_GULL', 'SONG_SPARROW', 'SOOTY_ALBATROSS', 'SPOTTED_CATBIRD', 'SUMMER_TANAGER', 'SWAINSON_WARBLER', 'TENNESSEE_WARBLER', 'TREE_SPARROW', 'TREE_SWALLOW', 'TROPICAL_KINGBIRD', 'VERMILION_FLYCATCHER', 'VESPER_SPARROW', 'WARBLING_VIREO', 'WCRSRT', 'WESTERN_GREBE', 'WESTERN_GULL', 'WESTERN_MEADOWLARK', 'WESTERN_WOOD_PEWEE', 'WHIP_POOR_WILL', 'WHITE_BREASTED_KINGFISHER', 'WHITE_BREASTED_NUTHATCH', 'WHITE_CROWNED_SPARROW', 'WHITE_EYED_VIREO', 'WHITE_NECKED_RAVEN', 'WHITE_PELICAN', 'WHITE_THROATED_SPARROW', 'WILSON_WARBLER', 'WINTER_WREN', 'WORM_EATING_WARBLER', 'YELLOW_BELLIED_FLYCATCHER', 'YELLOW_BILLED_CUCKOO', 'YELLOW_BREASTED_CHAT', 'YELLOW_HEADED_BLACKBIRD', 'YELLOW_THROATED_VIREO', 'YELLOW_WARBLER']
        #image transformations
        resize=(224,224)
        imageNet_mean=[0.485, 0.456, 0.406]
        imageNet_std= [0.229, 0.224, 0.225]

        self.val_transform = v2.Compose(
            [
                v2.ToImage(), v2.ToDtype(torch.float32, scale = True),
                v2.Resize(resize), v2.Normalize(imageNet_mean,imageNet_std)
            ]
        )

        #The model

        headPath=r"weights.pth"
        backendPath=r""
        self.dinoV2=torch.hub.load('facebookresearch/dinov2','dinov2_vits14')#,pretrained=False)#if it doesn't work, then load_state_dict
        #self.dinoV2.load_state_dict(torch.load(backendPath,map_location='cpu'))
        self.dinoV2.eval()

        self.model= DeepNet().cpu()
        self.model.load_state_dict(torch.load(headPath,map_location='cpu'))
        self.model.eval()

    def classifyImg(self, image):
        input=self.val_transform(image).unsqueeze(0)#adds fake batch dim
        features=self.dinoV2(input)
        output=self.model(features)
        prediction_idx=torch.argmax(output)

        predicted_bird= self.class_labels[prediction_idx]
        return predicted_bird


if __name__ == "__main__":
     model=birdClassifier()
     img_path = sys.argv[1]
     img=Image.open(img_path)
     print(model.classifyImg(img))