{#if enableBadgeTools}
	<div id="badgeToolsModal" class="modal wideModal hidden">
		<a href="javascript:void(0);" class="modalClose">✖</a>
		<div class="modalHeader">
			<h1 class="modalTitle">
				<span>Badge Tools</span>
			</h1>
		</div>
		<div class="modalContent">
			<form
				id="badgeToolsForm"
				enctype="multipart/form-data"
				method="post"
				class="fullWidth"
				onsubmit={validateForm}
			>
				<h3>Badge</h3>
				<div class="modalTabsContainer">
					<template v-for="(badge, b) in badges">
						<div
							class="modalTab"
							v-if="!badge.deleted"
							:class="active: b === badgeIndex"
							onclick={() => (badgeIndex = b)}
						>
							<label class="modalTabLabel">badge.badgeId (badge.gameName)</label>
						</div>
					</template>
					<div class="modalTab" onclick={addBadge}>
						<label class="modalTabLabel">+</label>
					</div>
				</div>
				<template v-for="(badge, b) in badges">
					<badge v-if="!badge.deleted" v-show="badge.index === badgeIndex" :index="b" />
				</template>
				<button type="button" click={exportZip}>Export</button>
			</form>
		</div>
	</div>
{/if}

<template id="tagTemplate">
	<ul class="formControls flexFormControls">
		<li class="formControlRow fullWidth">
			<label class="unselectable">Tag ID</label>
			<input v-model="tagId" type="text" autocomplete="off" />
		</li>
		<li class="formControlRow fullWidth" v-if="$parent.reqType === 'tags' || $parent.reqType === 'tagArrays'">
			<div class="textareaContainer">
				<label class="unselectable">Subcondition (for multi-tag badges)</label>
				<textarea
					v-model="description"
					class="autoExpand"
					:placeholder="$parent.currentTag.description"
				></textarea>
			</div>
		</li>
		<li class="formControlRow">
			<label class="unselectable">Map ID</label>
			<input v-model="map" type="number" min="0" max="9999" autocomplete="off" />
		</li>
		<template v-if="trigger !== 'teleport' && trigger !== 'coords'">
			<li class="formControlRow" :class=" fullWidth: mapCoords ">
				<label class="unselectable">Map Coords</label>
				<div>
					<button
						class="checkboxButton unselectable"
						:class=" toggled: mapCoords "
						type="button"
						onclick={() => (mapCoords = !mapCoords)}
					>
						<span></span>
					</button>
				</div>
			</li>
			<template v-if="mapCoords">
				<li class="formControlRow">
					<label class="unselectable">Map X1</label>
					<input v-model="mapX1" type="number" min="0" max="9999" autocomplete="off" />
				</li>
				<li class="formControlRow">
					<label class="unselectable">Map Y1</label>
					<input v-model="mapY1" type="number" min="0" max="9999" autocomplete="off" />
				</li>
				<li class="formControlRow">
					<label class="unselectable">Map X2</label>
					<input v-model="mapX2" type="number" min="0" max="9999" autocomplete="off" />
				</li>
				<li class="formControlRow">
					<label class="unselectable">Map Y2</label>
					<input v-model="mapY2" type="number" min="0" max="9999" autocomplete="off" />
				</li>
			</template>
		</template>
		<li class="formControlRow fullWidth">
			<label class="unselectable">Switch Condition</label>
			<select v-model="switchMode">
				<option :value="switchModeOption.key" v-for="switchModeOption in switchModeOptions">
					[[switchModeOption.label]]
				</option>
			</select>
		</li>
		<template v-if="switchMode">
			<li class="formControlRow" v-if="switchMode === 'switch'">
				<label class="unselectable">Switch</label>
				<div>
					<label class="unselectable">ID</label>
					<input v-model="switchId" type="number" min="0" max="99999" autocomplete="off" />
				</div>
				<label class="unselectable">Value</label>
				<div>
					<button
						class="checkboxButton unselectable"
						:class=" toggled: switchValue "
						type="button"
						onclick={() => (switchValue = !switchValue)}
					>
						<span></span>
					</button>
				</div>
			</li>
			<template v-else-if="switchMode === 'switches'">
				<li class="formControlRow fullWidth" v-for="(switchId, s) in switchIds">
					<label class="unselectable">Switch [[s + 1]]</label>
					<div>
						<label class="unselectable">ID</label>
						<input v-model="switchIds[s]" type="number" min="0" max="99999" autocomplete="off" />
					</div>
					<label class="unselectable">Value</label>
					<div>
						<button
							class="checkboxButton unselectable"
							:class=" toggled: switchValues[s] "
							type="button"
							onclick={() => (switchValues[s] = !switchValues[s])}
						>
							<span></span>
						</button>
					</div>
				</li>
				<li class="formControlRow fullWidth">
					<span></span>
					<button type="button" onclick={() => addSwitch()}>+</button>
				</li>
			</template>
			<li class="formControlRow">
				<label class="unselectable">Switch Delay</label>
				<div>
					<button
						class="checkboxButton unselectable"
						:class=" toggled: switchDelay "
						type="button"
						onclick={() => (switchDelay = !switchDelay)}
					>
						<span></span>
					</button>
				</div>
			</li>
		</template>
		<li class="formControlRow fullWidth">
			<label class="unselectable">Variable Condition</label>
			<select v-model="varMode">
				<option :value="varModeOption.key" v-for="varModeOption in varModeOptions">
					[[varModeOption.label]]
				</option>
			</select>
		</li>
		<template v-if="varMode">
			<li class="formControlRow" v-if="varMode === 'var'">
				<label class="unselectable">Variable</label>
				<div>
					<label class="unselectable">ID</label>
					<input v-model="varId" type="number" min="0" max="99999" autocomplete="off" />
				</div>
				<div>
					<label class="unselectable">Op</label>
					<select v-model="varOp">
						<option v-for="varOp in varOpOptions">{{ varOp }}</option>
					</select>
				</div>
				<div>
					<label class="unselectable">Value</label>
					<input v-model="varValue" type="number" min="0" max="99999" autocomplete="off" />
				</div>
				<div v-if="varOp === '>=<'">
					<label class="unselectable">Value 2</label>
					<input v-model="varValue2" type="number" min="0" max="99999" autocomplete="off" />
				</div>
			</li>
			<template v-else-if="varMode === 'vars'">
				<li class="formControlRow fullWidth" v-for="(varId, v) in varIds">
					<label class="unselectable">Variable [[v + 1]]</label>
					<div>
						<label class="unselectable">ID</label>
						<input v-model="varIds[v]" type="number" min="0" max="99999" autocomplete="off" />
					</div>
					<div>
						<label class="unselectable">Op</label>
						<select v-model="varOps[v]">
							<option v-for="varOp in varOpOptions">{{ varOp }}</option>
						</select>
					</div>
					<div>
						<label class="unselectable">Value</label>
						<input v-model="varValues[v]" type="number" min="0" max="99999" autocomplete="off" />
					</div>
				</li>
				<li class="formControlRow fullWidth">
					<span></span>
					<button type="button" onclick={() => addVar()}>+</button>
				</li>
			</template>
			<li class="formControlRow">
				<label class="unselectable">Variable Delay</label>
				<div>
					<button
						class="checkboxButton unselectable"
						:class=" toggled: varDelay "
						type="button"
						onclick={() => (varDelay = !varDelay)}
					>
						<span></span>
					</button>
				</div>
			</li>
			<li class="formControlRow" v-if="switchMode">
				<label class="unselectable">Variable Trigger</label>
				<div>
					<button
						class="checkboxButton unselectable"
						:class=" toggled: varTrigger "
						type="button"
						onclick={() => (varTrigger = !varTrigger)}
					>
						<span></span>
					</button>
				</div>
			</li>
		</template>
		<li class="formControlRow" :class=" fullWidth: trigger === 'teleport' || trigger === 'coords' ">
			<label class="unselectable">Trigger</label>
			<select v-model="trigger">
				<option :value="triggerOption.key" v-for="triggerOption in triggerOptions">
					[[triggerOption.label]]
				</option>
			</select>
		</li>
		<li class="formControlRow" v-if="hasTriggerValue">
			<label class="unselectable">{{ triggerValueName }}</label>
			<input v-model="value" type="text" autocomplete="off" />
		</li>
		<template v-else-if="hasTriggerValueList">
			<li class="formControlRow fullWidth" v-for="(value, v) in values">
				<label class="unselectable">[[triggerValueName]] #[[v + 1]]</label>
				<input v-model="values[v]" type="text" autocomplete="off" />
			</li>
			<li class="formControlRow fullWidth">
				<span></span>
				<button type="button" onclick={() => addValue()}>+</button>
			</li>
		</template>

		<template v-if="trigger === 'teleport' || trigger === 'coords'">
			<li class="formControlRow">
				<label class="unselectable">Map X1</label>
				<input v-model="mapX1" type="number" min="0" max="9999" autocomplete="off" />
			</li>
			<li class="formControlRow">
				<label class="unselectable">Map Y1</label>
				<input v-model="mapY1" type="number" min="0" max="9999" autocomplete="off" />
			</li>
			<li class="formControlRow">
				<label class="unselectable">Map X2</label>
				<input v-model="mapX2" type="number" min="0" max="9999" autocomplete="off" />
			</li>
			<li class="formControlRow">
				<label class="unselectable">Map Y2</label>
				<input v-model="mapY2" type="number" min="0" max="9999" autocomplete="off" />
			</li>
		</template>
		<li class="formControlRow">
			<label class="unselectable">Time Trial</label>
			<div>
				<button
					class="checkboxButton unselectable"
					:class=" toggled: timeTrial "
					type="button"
					onclick={() => (timeTrial = !timeTrial)}
				>
					<span></span>
				</button>
			</div>
		</li>
		<li class="formControlRow">
			<button type="button" onclick={() => deleteTag()}>Delete</button>
		</li>
	</ul>
</template>

<template id="badgeTemplate">
	<div>
		<ul class="formControls flexFormControls">
			<li class="formControlRow fullWidth">
				<label class="unselectable">Badge ID</label>
				<input v-model="badgeId" type="text" autocomplete="off" />
			</li>
			<li class="formControlRow">
				<label class="unselectable">Game</label>
				<select v-model="gameId">
					<option :value="gameOption.key" v-for="gameOption in gameOptions">[[gameOption.label]]</option>
				</select>
			</li>
			<li class="formControlRow" v-if="groupOptions.length">
				<label class="unselectable">Group</label>
				<select v-model="group">
					<option :value="groupOption.key" v-for="groupOption in groupOptions">[[groupOption.label]]</option>
				</select>
			</li>
			<li class="formControlRow">
				<label class="unselectable">Order</label>
				<input v-model="order" type="number" min="0" max="9999" autocomplete="off" />
			</li>
			<li class="formControlRow">
				<label class="unselectable">Map Order</label>
				<input v-model="mapOrder" type="number" min="0" max="9999" autocomplete="off" />
			</li>
			<li class="formControlRow">
				<label class="unselectable">Badge Name</label>
				<input v-model="name" type="text" autocomplete="off" />
			</li>
			<li class="formControlRow fullWidth">
				<div class="textareaContainer">
					<label class="unselectable">Description</label>
					<textarea v-model="description" class="autoExpand"></textarea>
				</div>
			</li>
			<li class="formControlRow fullWidth">
				<div class="textareaContainer">
					<label class="unselectable">Condition</label>
					<textarea v-model="condition" class="autoExpand"></textarea>
				</div>
			</li>
			<li class="formControlRow">
				<label class="unselectable">Artist</label>
				<input v-model="art" type="text" autocomplete="off" />
			</li>
			<li class="formControlRow">
				<label class="unselectable">Animated</label>
				<div>
					<button
						class="checkboxButton unselectable"
						:class="toggled: animated"
						type="button"
						onclick={() => (animated = !animated)}
					>
						<span></span>
					</button>
				</div>
			</li>
			<li class="formControlRow">
				<label class="unselectable">BP</label>
				<select v-model="bp">
					<option v-for="i in 11">[[(i - 1) * 5]]</option>
				</select>
			</li>
			<li class="formControlRow fullWidth">
				<label class="unselectable">Requirement Type</label>
				<select id="badgeGroup" v-model="reqType">
					<option value="">None (Mod Granted)</option>
					<option value="tag">Tag</option>
					<option value="tags">Multiple Tags</option>
					<option value="tagArrays">Multiple Tags with Alternatives</option>
					<option value="timeTrial">Time Trial</option>
				</select>
			</li>
			<li class="formControlRow" v-if="reqType === 'timeTrial'">
				<label class="unselectable">Required Int</label>
				<input v-model="reqInt" type="number" min="0" max="99999" autocomplete="off" />
			</li>
			<li class="formControlRow fullWidth" v-if="reqType === 'tags' || reqType === 'tagArrays'">
				<label class="unselectable">Tag Requirement Count</label>
				<input
					v-model="reqCount"
					v-if="reqType === 'tags'"
					type="number"
					min="0"
					:max="reqStrings.length"
					autocomplete="off"
				/>
				<input
					v-model="reqCount"
					v-if="reqType === 'tagArrays'"
					type="number"
					min="0"
					:max="reqStringArrays.length"
					autocomplete="off"
				/>
			</li>
			<li class="formControlRow fullWidth">
				<label class="unselectable">Map ID</label>
				<input v-model="map" type="number" min="0" max="9999" autocomplete="off" />
			</li>
			<li class="formControlRow">
				<label class="unselectable">Secret</label>
				<div>
					<button
						class="checkboxButton unselectable"
						:class="toggled: secret"
						type="button"
						onclick={() => (secret = !secret)}
					>
						<span></span>
					</button>
				</div>
			</li>
			<li class="formControlRow">
				<label class="unselectable">Secret Map</label>
				<div>
					<button
						class="checkboxButton unselectable"
						:class="toggled: secretMap"
						type="button"
						onclick={() => (secretMap = !secretMap)}
					>
						<span></span>
					</button>
				</div>
			</li>
			<li class="formControlRow">
				<label class="unselectable">Secret Condition</label>
				<div>
					<button
						class="checkboxButton unselectable"
						:class="toggled: secretCondition"
						type="button"
						onclick={() => (secretCondition = !secretCondition)}
					>
						<span></span>
					</button>
				</div>
			</li>
			<li class="formControlRow">
				<label class="unselectable">Hidden</label>
				<div>
					<button
						class="checkboxButton unselectable"
						:class="toggled: hidden"
						type="button"
						onclick={() => (hidden = !hidden)}
					>
						<span></span>
					</button>
				</div>
			</li>
			<li class="formControlRow">
				<label class="unselectable">Parent Badge ID</label>
				<input v-model="parent" type="text" autocomplete="off" />
			</li>
			<li class="formControlRow fullWidth">
				<label class="unselectable">Overlay</label>
				<div>
					<button
						class="checkboxButton unselectable"
						:class="toggled: overlay"
						type="button"
						onclick={() => (overlay = !overlay)}
					>
						<span></span>
					</button>
				</div>
			</li>
			<template v-if="overlay">
				<li class="formControlRow">
					<label class="unselectable">Gradient</label>
					<div>
						<button
							class="checkboxButton unselectable"
							:class="toggled: overlayTypeGradient"
							type="button"
							onclick={() => (overlayTypeGradient = !overlayTypeGradient)}
						>
							<span></span>
						</button>
					</div>
				</li>
				<li class="formControlRow">
					<label class="unselectable">Multiply</label>
					<div>
						<button
							class="checkboxButton unselectable"
							:class="toggled: overlayTypeMultiply"
							type="button"
							onclick={() => (overlayTypeMultiply = !overlayTypeMultiply)}
						>
							<span></span>
						</button>
					</div>
				</li>
				<li class="formControlRow">
					<label class="unselectable">Mask</label>
					<div>
						<button
							class="checkboxButton unselectable"
							:class="toggled: overlayTypeMask"
							type="button"
							onclick={() => (overlayTypeMask = !overlayTypeMask)}
						>
							<span></span>
						</button>
					</div>
				</li>
				<li class="formControlRow">
					<label class="unselectable">Dual</label>
					<div>
						<button
							class="checkboxButton unselectable"
							:class="toggled: overlayTypeDual"
							type="button"
							onclick={() => (overlayTypeDual = !overlayTypeDual)}
						>
							<span></span>
						</button>
					</div>
				</li>
				<li class="formControlRow">
					<label class="unselectable">Location</label>
					<div>
						<button
							class="checkboxButton unselectable"
							:class="toggled: overlayTypeLocation"
							type="button"
							onclick={() => (overlayTypeLocation = !overlayTypeLocation)}
						>
							<span></span>
						</button>
					</div>
				</li>
			</template>
			<li class="formControlRow">
				<label class="unselectable">Batch</label>
				<input v-model="batch" type="number" min="0" autocomplete="off" />
			</li>
			<li class="formControlRow">
				<label class="unselectable">Dev</label>
				<div>
					<button
						class="checkboxButton unselectable"
						:class="toggled: dev"
						type="button"
						onclick={() => (dev = !dev)}
					>
						<span></span>
					</button>
				</div>
			</li>
			<li class="formControlRow">
				<button type="button" onclick={() => deleteBadge()}>Delete</button>
			</li>
		</ul>
		<h3>Tag</h3>
		<div class="modalTabsContainer" v-if="reqType === 'tags' || reqType === 'tagArrays'">
			<template v-for="(tag, t) in tags">
				<div
					class="modalTab"
					v-if="!tag.deleted && tag.siblingIndex < 0"
					:class="active: t === tagIndex"
					onclick={() => (tagIndex = t)}
				>
					<label class="modalTabLabel">[[displayTag(tag)]]</label>
				</div>
			</template>
			<div class="modalTab" onclick={addTag}><label class="modalTabLabel">+</label></div>
		</div>
		<div class="subTabs badgeTagTabs" v-if="reqType === 'tagArrays' && currentTag">
			<div
				v-show="currentTag.siblings?.length"
				class="subTab"
				:class="active: currentTag.index === tagIndex"
				onclick={() => (tagIndex = currentTag.index)}
			>
				<small class="subTabLabel infoLabel unselectable">[[currentTag.tagId]]</small>
				<div class="subTabBg"></div>
			</div>
			<template v-for="(sibling, t) in tags">
				<div
					v-if="!sibling.deleted && sibling.siblingIndex === currentTag.index"
					class="subTab"
					:class="active: t === tagIndex"
					onclick={() => (tagIndex = t)}
				>
					<small class="subTabLabel infoLabel unselectable">[[sibling.tagId || '&lt;unnamed>']]</small>
					<div class="subTabBg"></div>
				</div>
			</template>
			<div class="subTab" onclick={() => addTag(currentTag.index)}>
				<small class="subTabLabel unselectable">+</small>
				<div class="subTabBg"></div>
			</div>
		</div>
		<template v-for="(tag, t) in tags">
			<tag v-if="!tag?.deleted" v-show="t === tagIndex" :index="t"></tag>
		</template>
	</div>
</template>
